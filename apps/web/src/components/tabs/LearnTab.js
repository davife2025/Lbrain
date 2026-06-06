'use client';
import { useState } from 'react';
const TOPICS = [
    { icon: '◈', title: 'What is LBank?', q: 'Explain what LBank exchange is and its key features' },
    { icon: '⚡', title: 'How spot trading works', q: 'Explain how spot trading works on a crypto exchange with examples' },
    { icon: '◑', title: 'Reading candlestick charts', q: 'Explain how to read candlestick charts for crypto trading' },
    { icon: '🔔', title: 'Support & resistance', q: 'Explain support and resistance levels in crypto trading with examples' },
    { icon: '◐', title: 'Market orders vs Limit', q: 'What is the difference between market orders and limit orders in crypto?' },
    { icon: '⬡', title: 'What is DeFi?', q: 'Explain decentralized finance (DeFi) in simple terms with examples' },
    { icon: '🤖', title: 'What is RSI indicator?', q: 'Explain the RSI indicator and how traders use it' },
    { icon: '◉', title: 'How to manage risk', q: 'Explain key risk management strategies for crypto trading' },
];
export default function LearnTab() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [asked, setAsked] = useState('');
    async function askQuestion(q) {
        const query = q || question.trim();
        if (!query || loading)
            return;
        setLoading(true);
        setAnswer('');
        setAsked(query);
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: query }],
                    mode: 'educator',
                }),
            });
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let full = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const lines = decoder.decode(value).split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: '))
                        continue;
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'text') {
                            full += data.text;
                            setAnswer(full);
                        }
                    }
                    catch { }
                }
            }
        }
        catch (err) {
            setAnswer(`❌ Error: ${err.message}`);
        }
        setLoading(false);
    }
    return (<div style={{ padding: '20px 16px 40px', fontFamily: "'DM Mono','Space Mono',monospace", maxWidth: 600, margin: '0 auto' }}>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Learn</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Crypto education powered by AI</div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askQuestion('')} placeholder="Ask anything about crypto, LBank, trading..." style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '10px 14px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = 'var(--blue)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
        <button onClick={() => askQuestion('')} disabled={loading || !question.trim()} style={{ padding: '10px 16px', borderRadius: 10, background: loading || !question.trim() ? 'var(--bg3)' : 'var(--blue)', border: 'none', color: loading || !question.trim() ? 'var(--text3)' : '#fff', cursor: loading || !question.trim() ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
          Ask
        </button>
      </div>

      {/* Answer */}
      {(answer || loading) && (<div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--blue)', marginBottom: 8, fontWeight: 600 }}>◈ LBrain</div>
          {asked && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Q: {asked}</div>}
          {loading && !answer ? (<div style={{ display: 'flex', gap: 4 }}>
              <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
            </div>) : (<div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{answer}</div>)}
        </div>)}

      {/* Topic cards */}
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
        Popular Topics
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TOPICS.map(t => (<button key={t.title} onClick={() => { setQuestion(t.q); askQuestion(t.q); }} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <span style={{ fontSize: 14, opacity: 0.7, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4 }}>{t.title}</span>
          </button>))}
      </div>
    </div>);
}
//# sourceMappingURL=LearnTab.js.map