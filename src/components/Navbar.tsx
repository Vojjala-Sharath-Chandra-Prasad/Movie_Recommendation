import { Clapperboard, LogOut, Menu, Search, Sparkles, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type NavbarProps = { activePage: 'home' | 'recommendations'; onNavigate: (page: 'home' | 'recommendations') => void; onSearch: (value: string) => void; onAuth: () => void };

export function Navbar({ activePage, onNavigate, onSearch, onAuth }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="navbar">
      <div className="nav-inner">
        <button className="brand" onClick={() => onNavigate('home')}><span className="brand-mark"><Clapperboard size={20} /></span><span>CHITRA<span>BOX</span></span></button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <button className={activePage === 'home' ? 'active' : ''} onClick={() => { onNavigate('home'); setMenuOpen(false); }}>Explore</button>
          <button className={activePage === 'recommendations' ? 'active' : ''} onClick={() => { onNavigate('recommendations'); setMenuOpen(false); }}><Sparkles size={15} /> For you</button>
        </nav>
        <div className="nav-actions">
          {searchOpen && <input autoFocus className="nav-search" placeholder="Search movies..." onChange={(event) => onSearch(event.target.value)} />}
          <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search"><Search size={19} /></button>
          {user ? <button className="profile-button" onClick={signOut}><span className="avatar"><UserRound size={15} /></span><span className="profile-email">{user.email?.split('@')[0]}</span><LogOut size={15} /></button> : <button className="login-link" onClick={onAuth}>Sign in</button>}
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
    </header>
  );
}
