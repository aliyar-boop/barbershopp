import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, Award, CalendarDays, Check, Clock3, MapPin, Phone, Scissors, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getServiceDescription, getServiceDuration } from '../features/service/serviceService'
import { subscribeLocalCatalog } from '../features/localAdmin/localCatalogService'
import EmptyState from '../components/EmptyState'
import Notice from '../components/Notice'

const dayLabels = ['Жк', 'Дш', 'Шш', 'Шр', 'Бш', 'Жм', 'Иш']
const barberResponsibilities = [
  'Кардардын каалоосун угуу жана түшүнүү.',
  'Бет түзүлүшүнө жана каалаган стилге ылайык чач жасалгасын сунуштоо.',
  'Чачты профессионалдуу жана тыкан алуу.',
  'Сакалды түздөө жана формага келтирүү.',
  'Жумуш ордун таза жана тартиптүү кармоо.',
  'Аспаптарды тазалыкта сактоо.',
  'Кардарларды белгиленген убакытта кабыл алуу.',
  'Кардарларга сылык жана маданияттуу мамиле кылуу.',
  'Кызмат көрсөтүүнүн сапатын сактоо.',
]

export default function HomePage() {
  const [year] = useState(() => new Date().getFullYear())
  const shopPhone = import.meta.env.VITE_SHOP_PHONE
  const shopAddress = import.meta.env.VITE_SHOP_ADDRESS || 'Бишкек, Кыргызстан'
  const [localCatalog, setLocalCatalog] = useState(null)
  const [failedBarberPhotos, setFailedBarberPhotos] = useState([])
  const [error, setError] = useState('')
  useEffect(() => subscribeLocalCatalog(setLocalCatalog, (loadError) => setError(loadError.message)), [])
  const displayedServices = localCatalog?.services.filter((service) => service.active !== false) || []
  const displayedBarbers = localCatalog?.barbers.filter((barber) => barber.active !== false) || []

  return (
    <main>
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="hero-content">
          <span className="eyebrow"><span /> ЭРКЕКТЕР ҮЧҮН КЛАССИКАЛЫК ЧЕБЕРЧИЛИК</span>
          <h1>Стилиңди тап.<br /><em>Өзүңө ишен.</em></h1>
          <p>Так кесим, кылдат тейлөө жана сизге ылайык өзгөчө образ. Ар бир баруу — өзүнө кам көрүүгө убакыт.</p>
          <div className="hero-actions">
            <Link to="/booking" className="button button-gold button-large">Онлайн жазылуу <ArrowRight size={17} /></Link>
            <a className="button button-text" href="#services">Кызматтарды көрүү <ArrowDown size={16} /></a>
          </div>
          <div className="hero-stats">
            <div><strong>10:00–20:00</strong><span>Барбердин иш графиги</span></div>
            <i />
            <div><strong>Премиум</strong><span>Кесипкөй тейлөө</span></div>
            <i />
            <div><strong>Онлайн</strong><span>Ыңгайлуу брондоо</span></div>
          </div>
        </div>
        <div className="hero-image" role="img" aria-label="Барбершопто чач кырктыруу">
          <div className="image-caption"><Scissors size={17} /><span>ЧЕБЕРЧИЛИК<br /><b>АР БИР ДЕТАЛДА</b></span></div>
        </div>
        <span className="hero-index">01 — 03</span>
      </section>

      <section className="feature-strip">
        <div><Award /><span><b>Кесипкөйлөр</b><small>Тажрыйбалуу барберлер</small></span></div>
        <div><Sparkles /><span><b>Сапаттуу тейлөө</b><small>Премиум каражаттар</small></span></div>
        <div><ShieldCheck /><span><b>Так убакыт</b><small>Алдын ала брондоо</small></span></div>
      </section>

      <section className="section section-about" id="about">
        <div className="section-kicker">GOLDEN CUT — БАРБЕРШОП</div>
        <div className="about-grid">
          <h2>Классика менен<br /><em>заманбаптык</em><br />айкалышкан жер.</h2>
          <p>Биз ар бир конокко өзгөчө мамиле кылабыз. Сиздин стилиңизди түшүнүп, так жана кылдат кызмат көрсөтүү — биздин иштин негизи. Өзүңүзгө убакыт бөлүңүз, калганын бизге ишениңиз.</p>
        </div>
      </section>

      <section className="section section-dark" id="services">
        <div className="section-heading">
          <div><div className="section-kicker">ТАКТЫК. САПАТ. СТИЛЬ.</div><h2>Биздин <em>кызматтар</em></h2></div>
          <Link to="/booking" className="text-link">Жазылуу <ArrowRight size={16} /></Link>
        </div>
        <Notice>{error}</Notice>
        {displayedServices.length ? (
          <div className="service-grid">{displayedServices.map((service, index) => {
            const duration = getServiceDuration(service)
            return (
              <article className="service-card" key={service.id}>
                <span className="service-number">0{index + 1}</span><Scissors className="service-icon" size={23} />
                <h3>{service.name}</h3>
                <p className="service-description">{getServiceDescription(service)}</p>
                <div className="service-meta"><span><Clock3 size={15} /> {duration ? `${duration} мүнөт` : 'Узактыгы тактала элек'}</span><strong>{service.price == null || service.price === '' ? 'Баасы тактала элек' : `${service.price} сом`}</strong></div>
                <Link to="/booking" className="button button-outline service-booking"><CalendarDays size={15} /> Жазылуу <ArrowRight size={15} /></Link>
              </article>
            )
          })}</div>
        ) : <EmptyState>Кызматтар азырынча кошула элек.</EmptyState>}
      </section>

      <section className="section" id="barbers">
        <div className="section-heading">
          <div><div className="section-kicker">СИЗДИН СТИЛЬ — БИЗДИН ИШ</div><h2>Биздин <em>барберлер</em></h2></div>
          <span className="muted-copy">Кесипкөйлөрдүн колунда өзүңүздү ишенимдүү сезиңиз.</span>
        </div>
        {displayedBarbers.length ? (
          <div className="barber-grid">{displayedBarbers.map((barber) => (
            <article className="barber-card" key={barber.id}>
              <div className="barber-photo">
                {barber.photoUrl && !failedBarberPhotos.includes(barber.id)
                  ? <img src={barber.photoUrl} alt={barber.name} onError={() => setFailedBarberPhotos((current) => [...current, barber.id])} />
                  : <div className="barber-placeholder"><Scissors size={42} /><span>GOLDEN CUT</span></div>}
                <span>БАРБЕР</span>
              </div>
              <div className="barber-info">
                <h3>{barber.name}</h3>
                <p className="barber-profession">{barber.bio?.trim() || 'Чач жасалгалоо жана сакал түздөө боюнча адис.'}</p>
                <p><Clock3 size={15} /> {barber.openTime || '10:00'} — {barber.closeTime || '20:00'} · {(barber.workingDays || [1, 2, 3, 4, 5, 6]).map((day) => dayLabels[day]).join(', ')}</p>
                <p><MapPin size={15} /> Golden Cut Barbershop</p>
                <div className="barber-services">{(barber.serviceIds?.length ? displayedServices.filter((service) => barber.serviceIds.includes(service.id)) : displayedServices).map((service) => <span key={service.id}>{service.name}</span>)}</div>
                {barber.skills?.length > 0 && <div className="barber-skills">{barber.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>}
                <div className="barber-duties"><h4>Кесиптик милдеттери</h4><ul>{barberResponsibilities.map((duty) => <li key={duty}><Check size={14} />{duty}</li>)}</ul></div>
                <Link to="/booking" className="button button-gold barber-booking"><CalendarDays size={15} /> Жазылуу <ArrowRight size={15} /></Link>
              </div>
            </article>
          ))}</div>
        ) : <EmptyState>Барберлер азырынча кошула элек.</EmptyState>}
      </section>

      <section className="booking-banner">
        <div><div className="section-kicker">ЖАҢЫ ОБРАЗГА БИР КАДАМ</div><h2>Сизге ыңгайлуу убакытты<br /><em>азыр тандаңыз.</em></h2></div>
        <Link to="/booking" className="button button-gold button-large">Жазылуу <ArrowRight size={18} /></Link>
      </section>

      <footer className="site-footer" id="contact">
        <Link className="brand" to="/"><span className="brand-mark"><Scissors size={20} /></span><span>GOLDEN<span className="brand-sub">CUT · BARBERSHOP</span></span></Link>
        <span><MapPin size={14} /> {shopAddress}</span>{shopPhone && <a className="footer-phone" href={`tel:${shopPhone}`}><Phone size={14} /> {shopPhone}</a>}<span><Clock3 size={14} /> 10:00 — 20:00</span><span>© {year} Golden Cut</span>
      </footer>
    </main>
  )
}
