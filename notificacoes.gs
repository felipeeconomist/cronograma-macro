/**
 * Notificações por e-mail do Cronograma Equipe Macro.
 *
 * Roda dentro da planilha do Google (Extensões > Apps Script). Faz duas coisas:
 *   1. resumoMensal(): no dia 1 de cada mês, envia a cada pessoa a lista das entregas dela no mês.
 *   2. lembreteDiario(): todo dia, avisa quem tem entrega daqui a CONFIG.DIAS_ANTES dias.
 *
 * Os e-mails ficam numa aba PRIVADA chamada "Pessoas" (colunas: Nome | E-mail).
 * Não publique essa aba na web.
 */

const CONFIG = {
  ABA_ENTREGAS: 'Entregas',
  ABA_PESSOAS: 'Pessoas',
  DIAS_ANTES: 3,        // lembrete enviado X dias antes da entrega
  HORA: 8,              // hora de envio (fuso da planilha)
  REMETENTE: 'Cronograma Equipe Macro',
  LINK_SITE: 'https://felipeeconomist.github.io/cronograma-macro/'
};

const MESES_ = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const DIAS_ = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

/* ---------- funções para rodar (menu "Executar") ---------- */

/** Envia o resumo do mês atual para cada pessoa. É o que o gatilho mensal executa. */
function resumoMensal() { enviarResumo_(false); }

/** Envia os lembretes de quem tem entrega em DIAS_ANTES dias. É o que o gatilho diário executa. */
function lembreteDiario() { enviarLembretes_(false); }

/** TESTE: manda todos os e-mails do resumo só para você (dono da planilha), sem avisar ninguém. */
function testeResumoMensal() { enviarResumo_(true); }

/** TESTE: manda os lembretes só para você. */
function testeLembrete() { enviarLembretes_(true); }

/** Rode UMA vez para ligar os envios automáticos (apaga gatilhos antigos desta automação). */
function configurarGatilhos() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['resumoMensal', 'lembreteDiario'].includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('resumoMensal').timeBased().onMonthDay(1).atHour(CONFIG.HORA).create();
  ScriptApp.newTrigger('lembreteDiario').timeBased().everyDays(1).atHour(CONFIG.HORA).create();
  Logger.log('Gatilhos criados: resumo no dia 1 de cada mês e lembrete diário, às ' + CONFIG.HORA + 'h.');
}

/* ---------- lógica ---------- */

function enviarResumo_(teste) {
  const { entregas, tz } = lerEntregas_();
  const hoje = hojeIso_(tz);
  const ym = hoje.slice(0, 7);
  const [ano, mes] = ym.split('-').map(Number);
  const doMes = entregas.filter(e => e.data.slice(0, 7) === ym && e.status !== 'cancelado');
  const nomeMes = MESES_[mes - 1] + ' de ' + ano;

  enviarPorPessoa_(doMes, teste, (nome, lista) => ({
    assunto: 'Suas entregas de ' + nomeMes + ' (' + lista.length + ')',
    corpo: '<p>Olá, ' + esc_(nome) + '. Estas são as suas entregas de <b>' + nomeMes + '</b>:</p>' + tabela_(lista, nome)
  }));
}

function enviarLembretes_(teste) {
  const { entregas, tz } = lerEntregas_();
  const alvo = somarDias_(hojeIso_(tz), CONFIG.DIAS_ANTES);
  const lista = entregas.filter(e => e.data === alvo && e.status !== 'entregue' && e.status !== 'cancelado');

  enviarPorPessoa_(lista, teste, (nome, itens) => ({
    assunto: 'Lembrete: entrega em ' + CONFIG.DIAS_ANTES + ' dias (' + dataBr_(alvo) + ')',
    corpo: '<p>Olá, ' + esc_(nome) + '. Você tem entrega prevista para <b>' + dataBr_(alvo) + '</b>:</p>' + tabela_(itens, nome)
  }));
}

function enviarPorPessoa_(entregas, teste, montar) {
  const pessoas = lerPessoas_();
  const porPessoa = {};
  entregas.forEach(e => e.responsaveis.forEach(r => {
    const k = norm_(r);
    (porPessoa[k] = porPessoa[k] || { nome: r, itens: [] }).itens.push(e);
  }));

  const euMesmo = Session.getEffectiveUser().getEmail();
  let enviados = 0;
  const semEmail = [];

  Object.keys(porPessoa).forEach(k => {
    const { nome, itens } = porPessoa[k];
    const p = pessoas[k];
    if (!p || !p.email) { semEmail.push(nome); return; }
    itens.sort((a, b) => a.data.localeCompare(b.data));
    const m = montar(p.nome || nome, itens);
    const rodape = '<p style="color:#667;font-size:12px">Calendário completo: <a href="' + CONFIG.LINK_SITE + '">' + CONFIG.LINK_SITE + '</a></p>';
    MailApp.sendEmail({
      to: teste ? euMesmo : p.email,
      subject: (teste ? '[TESTE para ' + p.nome + '] ' : '') + m.assunto,
      htmlBody: m.corpo + rodape,
      name: CONFIG.REMETENTE
    });
    enviados++;
  });

  Logger.log('E-mails enviados: ' + enviados + (teste ? ' (modo teste, todos para ' + euMesmo + ')' : ''));
  if (semEmail.length) Logger.log('Sem e-mail na aba "' + CONFIG.ABA_PESSOAS + '": ' + semEmail.join(', '));
}

function tabela_(lista, nomeAtual) {
  const td = 'style="padding:6px 10px;border-bottom:1px solid #ddd;vertical-align:top"';
  const linhas = lista.map(e => {
    const outros = e.responsaveis.filter(r => norm_(r) !== norm_(nomeAtual));
    return '<tr><td ' + td + '>' + dataBr_(e.data) + '<br><small>' + diaSemana_(e.data) + '</small></td>' +
      '<td ' + td + '><b>' + esc_(e.produto) + '</b><br>' + esc_(e.titulo) + '</td>' +
      '<td ' + td + '>' + esc_(e.escopo) + (outros.length ? '<br><small>Com: ' + esc_(outros.join(', ')) + '</small>' : '') + '</td>' +
      '<td ' + td + '>' + esc_(e.status) + '</td></tr>';
  }).join('');
  return '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
    '<tr style="text-align:left;background:#f3f4f6"><th ' + td + '>Data</th><th ' + td + '>Produto / entrega</th><th ' + td + '>Escopo</th><th ' + td + '>Status</th></tr>' +
    linhas + '</table>';
}

/* ---------- leitura da planilha ---------- */

function lerEntregas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(CONFIG.ABA_ENTREGAS);
  if (!aba) throw new Error('Não encontrei a aba "' + CONFIG.ABA_ENTREGAS + '". Ajuste CONFIG.ABA_ENTREGAS.');
  const tz = ss.getSpreadsheetTimeZone();
  const v = aba.getDataRange().getValues();
  const cab = v.shift().map(norm_);
  const col = (...ns) => cab.findIndex(h => ns.some(n => h === n || h.indexOf(n) === 0));
  const iP = col('produto', 'projeto'), iD = col('data'), iE = col('entrega', 'titulo'),
        iS = col('escopo'), iR = col('responsave'), iSt = col('status');
  if (iP < 0 || iD < 0) throw new Error('Não encontrei as colunas "Produto/Projeto" e "Data" na aba "' + CONFIG.ABA_ENTREGAS + '".');

  const entregas = [];
  v.forEach(r => {
    const produto = String(r[iP] || '').trim();
    const data = dataIso_(r[iD], tz);
    if (!produto || !data) return;
    const st = norm_(iSt >= 0 ? r[iSt] : '');
    entregas.push({
      produto, data,
      titulo: String((iE >= 0 && r[iE]) || produto).trim(),
      escopo: iS >= 0 ? String(r[iS] || '').trim() : '',
      responsaveis: iR >= 0 ? String(r[iR] || '').split(/\s*[,;\/]\s*|\s+e\s+/i).map(x => x.trim()).filter(Boolean) : [],
      status: st.indexOf('cancel') === 0 ? 'cancelado'
            : /entreg|conclu|public/.test(st) ? 'entregue'
            : st.indexOf('andamento') >= 0 ? 'em andamento' : 'planejado'
    });
  });
  return { entregas, tz };
}

function lerPessoas_() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ABA_PESSOAS);
  if (!aba) throw new Error('Crie a aba "' + CONFIG.ABA_PESSOAS + '" com as colunas Nome e E-mail.');
  const v = aba.getDataRange().getValues();
  const cab = v.shift().map(norm_);
  const iN = cab.findIndex(h => h.indexOf('nome') === 0);
  const iM = cab.findIndex(h => h.indexOf('e-mail') === 0 || h.indexOf('email') === 0);
  if (iN < 0 || iM < 0) throw new Error('A aba "' + CONFIG.ABA_PESSOAS + '" precisa das colunas "Nome" e "E-mail".');
  const mapa = {};
  v.forEach(r => {
    const nome = String(r[iN] || '').trim(), email = String(r[iM] || '').trim();
    if (nome) mapa[norm_(nome)] = { nome, email };
  });
  return mapa;
}

/* ---------- utilitários ---------- */

function norm_(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function hojeIso_(tz) { return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'); }
function dataBr_(iso) { const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; }
function diaSemana_(iso) { const [y, m, d] = iso.split('-').map(Number); return DIAS_[new Date(y, m - 1, d).getDay()]; }
function somarDias_(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
function dataIso_(v, tz) {
  if (v instanceof Date) return isNaN(v) ? null : Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  const s = String(v == null ? '' : v).trim();
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return y + '-' + String(+m[2]).padStart(2, '0') + '-' + String(+m[1]).padStart(2, '0'); }
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
}
