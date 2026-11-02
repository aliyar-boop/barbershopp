import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole, Mail, Scissors, UserRound } from 'lucide-react'
import { login, register } from '../features/auth/authService'
import { useAuth } from '../features/auth/authContext'
import { getErrorMessage } from '../utils/errors'
import Notice from '../components/Notice'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user } = useAuth()
  const [values, setValues] = useState({ name: '', phone: '', email: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  if (user) return <Navigate to={params.get('next') || '/account'} replace />

  function change(event) {
    setValues({ ...values, [event.target.name]: event.target.value })
  }
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const signedInUser = isRegister ? await register(values) : await login(values.email, values.password)
      navigate(params.get('next') || (signedInUser.role === 'barber' ? '/barber' : '/account'), { replace: true })
    } catch (authError) {
      setError(getErrorMessage(authError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-emblem"><Scissors size={22} /></div>
        <div className="section-kicker">{isRegister ? 'GOLDEN CUT КООМЧУЛУГУНА КОШУЛУҢУЗ' : 'КАБИНЕТКЕ КИРҮҮ'}</div>
        <h1>{isRegister ? 'Катталуу' : 'Кош келиңиз'}</h1>
        <p className="auth-intro">{isRegister ? 'Жазылуу үчүн аккаунт түзүңүз.' : 'Улантуу үчүн аккаунтуңузга кириңиз.'}</p>
        <Notice>{error}</Notice>
        <form onSubmit={submit} className="form-stack">
          {isRegister && <>
            <label>Аты-жөнү<div className="input-wrap"><UserRound size={17} /><input name="name" value={values.name} onChange={change} autoComplete="name" required minLength={2} placeholder="Атыңыз" /></div></label>
            <label>Телефон<div className="input-wrap"><span className="input-prefix">+</span><input name="phone" type="tel" value={values.phone} onChange={change} autoComplete="tel" required placeholder="996 700 000 000" /></div></label>
            <label>Аккаунт түрү<select name="role" value={values.role} onChange={change}><option value="user">Кардар</option><option value="barber">Барбер (демо)</option></select></label>
          </>}
          <label>Email<div className="input-wrap"><Mail size={17} /><input name="email" type="email" value={values.email} onChange={change} autoComplete="email" required placeholder="name@example.com" /></div></label>
          <label>Сырсөз<div className="input-wrap"><LockKeyhole size={17} /><input name="password" type="password" value={values.password} onChange={change} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={6} placeholder="Кеминде 6 белги" /></div></label>
          <button className="button button-gold button-large full-width" type="submit" disabled={busy}>{busy ? 'Күтүңүз...' : isRegister ? 'Аккаунт түзүү' : 'Кирүү'}</button>
        </form>
        {!isRegister && <p className="auth-intro">Демо барбер: barber@goldencut.demo · сырсөз: demo123456</p>}
        <p className="auth-switch">{isRegister ? 'Аккаунтуңуз барбы?' : 'Жаңы колдонуучусузбу?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Кирүү' : 'Катталуу'}</Link></p>
      </section>
    </main>
  )
}
