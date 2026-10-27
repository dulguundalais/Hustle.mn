'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Ban, Flag, ShieldCheck, X} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/v47-chat-safety.css';

/**
 * V47 chat safety UI. The database (migration v47_chat_safety) is the source of
 * truth: it rejects messages between blocked people and enforces rate limits,
 * so these components only explain and trigger those rules.
 */

export type ReportReason = 'spam' | 'harassment' | 'scam' | 'inappropriate' | 'other';

const REASONS: [ReportReason, string, string][] = [
  ['spam', 'Спам, хүсээгүй зар', 'Spam or unwanted promotion'],
  ['scam', 'Залилан, хуурамч санал', 'Scam or fraud attempt'],
  ['harassment', 'Дарамт, доромжлол', 'Harassment or abuse'],
  ['inappropriate', 'Зохисгүй агуулга', 'Inappropriate content'],
  ['other', 'Бусад', 'Something else'],
];

/** Friendly copy for the database's chat safety errors (matched by hint code). */
export function chatSafetyMessage(error: unknown, en: boolean): string | null {
  const hint = String((error as {hint?: string})?.hint || '');
  const t = (mn: string, eng: string) => (en ? eng : mn);
  switch (hint) {
    case 'hx_blocked': return t('Энэ хэрэглэгчтэй харилцах боломжгүй байна.', 'You cannot message this person.');
    case 'hx_rate_minute': return t('Хэт олон мессеж ойр ойрхон илгээлээ. Нэг минут хүлээгээд дахин оролдоно уу.', 'You are sending messages too quickly. Please wait a minute.');
    case 'hx_rate_hour': return t('Цагийн мессежийн хязгаарт хүрлээ. Түр хүлээгээд дахин оролдоно уу.', 'Hourly message limit reached. Please try again later.');
    case 'hx_rate_new': return t('Өнөөдөр олон шинэ хүнтэй яриа эхлүүлсэн байна. Маргааш дахин оролдоно уу.', 'You have started many new conversations today. Please try again tomorrow.');
    case 'hx_report_limit': return t('Өнөөдрийн гомдлын хязгаарт хүрлээ. Маргааш дахин илгээнэ үү.', 'Report limit reached. Please try again tomorrow.');
    default: return null;
  }
}

/** The signed-in person's own blocks. The blocked side never sees these rows. */
export function useChatBlocks(uid: string) {
  const [blocked, setBlocked] = useState<string[]>([]);
  const refresh = useCallback(async () => {
    if (!uid) { setBlocked([]); return; }
    const db = await marketplaceClient();
    const result = await db.from('user_blocks').select('blocked_id').eq('blocker_id', uid);
    if (!result.error) setBlocked((result.data || []).map((row: {blocked_id: string}) => row.blocked_id));
  }, [uid]);
  useEffect(() => { void refresh(); }, [refresh]);
  const block = useCallback(async (peer: string) => {
    const db = await marketplaceClient();
    const result = await db.from('user_blocks').insert({blocker_id: uid, blocked_id: peer});
    if (result.error && result.error.code !== '23505') throw result.error;
    setBlocked(list => (list.includes(peer) ? list : [...list, peer]));
  }, [uid]);
  const unblock = useCallback(async (peer: string) => {
    const db = await marketplaceClient();
    const result = await db.from('user_blocks').delete().eq('blocker_id', uid).eq('blocked_id', peer);
    if (result.error) throw result.error;
    setBlocked(list => list.filter(id => id !== peer));
  }, [uid]);
  return {blocked, block, unblock, refresh};
}

/** Block / report actions shown in the conversation header. */
export function ChatSafetyActions({uid, peerId, peerName, lastPeerMessageId, isBlocked, onBlock, onUnblock, en, onError, onNotice}: {
  uid: string; peerId: string; peerName: string; lastPeerMessageId?: string | null; isBlocked: boolean;
  onBlock: (peer: string) => Promise<void>; onUnblock: (peer: string) => Promise<void>; en: boolean;
  onError: (error: unknown) => void; onNotice: (message: string) => void;
}) {
  const t = (mn: string, eng: string) => (en ? eng : mn);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [includeMessage, setIncludeMessage] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setConfirmBlock(false); setReporting(false); setDetails(''); setReason('spam'); }, [peerId]);

  async function run(action: () => Promise<void>, notice: string) {
    if (busy) return;
    setBusy(true);
    try { await action(); onNotice(notice); } catch (error) { onError(error); } finally { setBusy(false); }
  }

  async function sendReport() {
    const db = await marketplaceClient();
    const result = await db.from('message_reports').insert({
      reporter_id: uid, reported_id: peerId, reason, details: details.trim().slice(0, 1000),
      message_id: includeMessage && lastPeerMessageId ? lastPeerMessageId : null,
    });
    if (result.error) {
      if (result.error.code === '23505') throw new Error(t('Энэ мессежийн талаар та гомдол гаргасан байна.', 'You have already reported this message.'));
      throw result.error;
    }
    setReporting(false); setDetails('');
  }

  return (
    <div className="v47-safety">
      <div className="v47-safety-buttons">
        {isBlocked
          ? <button type="button" className="v47-link" disabled={busy}
              onClick={() => void run(() => onUnblock(peerId), t('Хоригийг цуцаллаа.', 'Unblocked.'))}>
              <ShieldCheck size={15} aria-hidden="true" />{t('Хориг цуцлах', 'Unblock')}
            </button>
          : <button type="button" className="v47-link" aria-expanded={confirmBlock} onClick={() => { setConfirmBlock(v => !v); setReporting(false); }}>
              <Ban size={15} aria-hidden="true" />{t('Хориглох', 'Block')}
            </button>}
        <button type="button" className="v47-link v47-link-danger" aria-expanded={reporting} onClick={() => { setReporting(v => !v); setConfirmBlock(false); }}>
          <Flag size={15} aria-hidden="true" />{t('Гомдол гаргах', 'Report')}
        </button>
      </div>

      {confirmBlock && !isBlocked && (
        <div className="v47-panel" role="region" aria-label={t('Хориглох', 'Block')}>
          <p><strong>{t('Харилцахыг хориглох уу: ' + peerName + '?', 'Block ' + peerName + '?')}</strong></p>
          <p className="v47-muted">{t('Та хоёр бие биедээ мессеж илгээх боломжгүй болно. Өмнөх яриа хадгалагдана. Тухайн хэрэглэгчид мэдэгдэхгүй.', 'Neither of you will be able to send new messages. Earlier messages stay. They will not be notified.')}</p>
          <div className="v47-row">
            <button type="button" className="button small" disabled={busy}
              onClick={() => void run(async () => { await onBlock(peerId); setConfirmBlock(false); }, t('Энэ хэрэглэгчтэй харилцахыг хориглолоо.', 'Blocked.'))}>
              {t('Хориглох', 'Block')}
            </button>
            <button type="button" className="button outline small" onClick={() => setConfirmBlock(false)}>{t('Болих', 'Cancel')}</button>
          </div>
        </div>
      )}

      {reporting && (
        <form className="v47-panel" aria-label={t('Гомдол гаргах', 'Report')}
          onSubmit={event => { event.preventDefault(); void run(sendReport, t('Гомдлыг хүлээн авлаа. Админ хянаж үзнэ.', 'Report sent. An admin will review it.')); }}>
          <div className="v47-panel-head">
            <strong>{t('Гомдол гаргах: ' + peerName, 'Report ' + peerName)}</strong>
            <button type="button" className="v47-icon" aria-label={t('Хаах', 'Close')} onClick={() => setReporting(false)}><X size={16} /></button>
          </div>
          <fieldset className="v47-reasons">
            <legend className="v47-muted">{t('Шалтгаан', 'Reason')}</legend>
            {REASONS.map(([value, mn, eng]) => (
              <label key={value}><input type="radio" name="v47-reason" value={value} checked={reason === value} onChange={() => setReason(value)} />{en ? eng : mn}</label>
            ))}
          </fieldset>
          <label className="v47-field">{t('Нэмэлт тайлбар (заавал биш)', 'Details (optional)')}
            <textarea value={details} maxLength={1000} rows={3} onChange={event => setDetails(event.target.value)} />
          </label>
          {lastPeerMessageId && (
            <label className="v47-check"><input type="checkbox" checked={includeMessage} onChange={event => setIncludeMessage(event.target.checked)} />
              {t('Сүүлийн мессежийг гомдолд хавсаргах', 'Attach their latest message')}</label>
          )}
          <div className="v47-row">
            <button type="submit" className="button small" disabled={busy}>{t('Илгээх', 'Send report')}</button>
            {!isBlocked && <button type="button" className="button outline small" disabled={busy}
              onClick={() => void run(async () => { await sendReport(); await onBlock(peerId); }, t('Гомдлыг илгээж, харилцахыг хориглолоо.', 'Reported and blocked.'))}>
              {t('Илгээж, хориглох', 'Report and block')}
            </button>}
          </div>
        </form>
      )}
    </div>
  );
}

/** Replaces the composer while the signed-in person has blocked this contact. */
export function BlockedComposer({en, busy, onUnblock}: {en: boolean; busy?: boolean; onUnblock: () => void}) {
  const t = (mn: string, eng: string) => (en ? eng : mn);
  return (
    <div className="v47-blocked" role="status">
      <Ban size={18} aria-hidden="true" />
      <span>{t('Та энэ хэрэглэгчтэй харилцахыг хориглосон байна.', 'You blocked this person, so messages are turned off.')}</span>
      <button type="button" className="button outline small" disabled={busy} onClick={onUnblock}>{t('Хориг цуцлах', 'Unblock')}</button>
    </div>
  );
}

type AdminReport = {
  id: string; status: 'open' | 'actioned' | 'dismissed'; reason: ReportReason; details: string; admin_note: string;
  created_at: string; reviewed_at: string | null; reporter_name: string; reported_id: string; reported_name: string;
  reported_email: string | null; reported_open_reports: number; message_body: string | null; message_created_at: string | null;
};

/** Admin moderation queue for chat reports. */
export function AdminChatReports({en, onError, onNotice}: {en: boolean; onError: (error: unknown) => void; onNotice: (message: string) => void}) {
  const t = (mn: string, eng: string) => (en ? eng : mn);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  // Parent handlers change identity every render; keep the latest without re-running the load.
  const handlers = useRef({onError, onNotice});
  handlers.current = {onError, onNotice};

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await marketplaceClient();
      const result = await db.rpc('admin_message_reports', {p_status: filter});
      if (result.error) throw result.error;
      setReports((result.data || []) as AdminReport[]);
    } catch (error) { handlers.current.onError(error); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);

  async function resolve(report: AdminReport, status: 'actioned' | 'dismissed', disableAccount = false) {
    if (busy) return;
    setBusy(report.id);
    try {
      const db = await marketplaceClient();
      if (disableAccount) {
        if (!report.reported_email) throw new Error(t('Хэрэглэгчийн имэйл олдсонгүй.', 'Account e-mail not found.'));
        const access = await db.rpc('manage_beta', {target_email: report.reported_email, target_role: 'member', target_enabled: false});
        if (access.error) throw access.error;
      }
      const result = await db.from('message_reports').update({status, admin_note: (notes[report.id] || '').trim().slice(0, 1000)}).eq('id', report.id);
      if (result.error) throw result.error;
      handlers.current.onNotice(disableAccount ? t('Хэрэглэгчийн эрхийг хаалаа.', 'Account access disabled.') : t('Гомдлыг шийдвэрлэлээ.', 'Report resolved.'));
      await load();
    } catch (error) { handlers.current.onError(error); } finally { setBusy(''); }
  }

  const reasonLabel = (value: ReportReason) => { const r = REASONS.find(([key]) => key === value); return r ? (en ? r[2] : r[1]) : value; };
  const statusLabel = (value: AdminReport['status']) => value === 'open' ? t('Шийдвэрлээгүй', 'Open') : value === 'actioned' ? t('Арга хэмжээ авсан', 'Actioned') : t('Хэрэгсэхгүй болгох', 'Dismissed');

  return (
    <section className="workspace-panel v47-admin">
      <div className="v47-panel-head">
        <h2>{t('Чатын гомдол', 'Chat reports')}</h2>
        <div className="v47-row">
          {(['open', 'all'] as const).map(value => (
            <button key={value} type="button" className={'button small' + (filter === value ? '' : ' outline')} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value === 'open' ? t('Шийдвэрлээгүй', 'Open') : t('Бүгд', 'All')}
            </button>
          ))}
        </div>
      </div>
      {loading ? <p className="v47-muted">{t('Ачаалж байна…', 'Loading…')}</p>
        : !reports.length ? <p className="v47-muted">{filter === 'open' ? t('Шийдвэрлээгүй гомдол алга.', 'No open reports.') : t('Гомдол алга.', 'No reports yet.')}</p>
        : <ul className="v47-report-list">
            {reports.map(report => (
              <li key={report.id} className="v47-report">
                <div className="v47-report-head">
                  <span className={'v47-badge v47-badge-' + report.status}>{statusLabel(report.status)}</span>
                  <strong>{reasonLabel(report.reason)}</strong>
                  <small className="v47-muted">{new Date(report.created_at).toLocaleString(en ? 'en-US' : 'mn-MN')}</small>
                </div>
                <p>{t('Гомдол гаргагч', 'Reported by')}: <b>{report.reporter_name}</b> · {t('Холбогдох хэрэглэгч', 'About')}: <b>{report.reported_name}</b>
                  {report.reported_open_reports > 1 && <span className="v47-warn"> · {report.reported_open_reports} {t('шийдвэрлээгүй гомдол', 'open reports')}</span>}</p>
                {report.message_body && <blockquote className="v47-quote">{report.message_body}</blockquote>}
                {report.details && <p className="v47-muted">{report.details}</p>}
                {report.status === 'open' ? (
                  <>
                    <label className="v47-field">{t('Админы тэмдэглэл', 'Admin note')}
                      <input value={notes[report.id] || ''} maxLength={1000} onChange={event => setNotes(n => ({...n, [report.id]: event.target.value}))} />
                    </label>
                    <div className="v47-row">
                      <button type="button" className="button outline small" disabled={!!busy} onClick={() => void resolve(report, 'dismissed')}>{t('Хэрэгсэхгүй болгох', 'Dismiss')}</button>
                      <button type="button" className="button small" disabled={!!busy} onClick={() => void resolve(report, 'actioned')}>{t('Шийдвэрлэснээр тэмдэглэх', 'Mark actioned')}</button>
                      <button type="button" className="button small v47-danger" disabled={!!busy || !report.reported_email}
                        onClick={() => { if (window.confirm(t('Дараах хэрэглэгчийн эрхийг хаах уу: ' + report.reported_name + '?', 'Disable access for ' + report.reported_name + '?'))) void resolve(report, 'actioned', true); }}>
                        {t('Эрхийг хаах', 'Disable account')}
                      </button>
                    </div>
                  </>
                ) : report.admin_note ? <p className="v47-muted">{t('Тэмдэглэл', 'Note')}: {report.admin_note}</p> : null}
              </li>
            ))}
          </ul>}
    </section>
  );
}
