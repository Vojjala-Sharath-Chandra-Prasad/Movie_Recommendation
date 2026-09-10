import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, Check, ChevronLeft, Clapperboard, Sparkles, Star, X } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Movie, Rating, UserWatchlist } from '@/types';
import { MovieCard } from '@/components/MovieCard';
import { Navbar } from '@/components/Navbar';

type Page = 'home' | 'recommendations' | 'auth';
type AuthMode = 'signin' | 'signup';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [watchlist, setWatchlist] = useState<UserWatchlist[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [genre, setGenre] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      const { data, error: movieError } = await supabase.from('movies').select('*').order('rating', { ascending: false });
      if (movieError) setError('We could not load the movie catalogue. Please refresh and try again.');
      else setMovies((data ?? []) as Movie[]);
      setLoading(false);
    }
    loadMovies();
  }, []);

  useEffect(() => {
    async function loadUserData() {
      if (!user) { setRatings([]); setWatchlist([]); return; }
      const [ratingResponse, watchlistResponse] = await Promise.all([
        supabase.from('ratings').select('movie_id, score'),
        supabase.from('watchlist').select('movie_id'),
      ]);
      if (ratingResponse.data) setRatings(ratingResponse.data as Rating[]);
      if (watchlistResponse.data) setWatchlist(watchlistResponse.data as UserWatchlist[]);
    }
    loadUserData();
  }, [user]);

  const genres = useMemo(() => ['All', ...Array.from(new Set(movies.flatMap((movie) => movie.genres))).slice(0, 8)], [movies]);
  const visibleMovies = useMemo(() => movies.filter((movie) => {
    const matchesGenre = genre === 'All' || movie.genres.includes(genre);
    const matchesSearch = !search || movie.title.toLowerCase().includes(search.toLowerCase()) || movie.lead_actors.some((actor) => actor.toLowerCase().includes(search.toLowerCase()));
    return matchesGenre && matchesSearch;
  }), [genre, movies, search]);
  const recommendedMovies = useMemo(() => {
    const likedGenres = ratings.flatMap((rating) => {
      const movie = movies.find((item) => item.id === rating.movie_id);
      return rating.score >= 4 ? movie?.genres ?? [] : [];
    });
    return [...movies].filter((movie) => !ratings.some((rating) => rating.movie_id === movie.id)).sort((a, b) => {
      const aScore = a.genres.filter((item) => likedGenres.includes(item)).length;
      const bScore = b.genres.filter((item) => likedGenres.includes(item)).length;
      return bScore - aScore || b.rating - a.rating;
    });
  }, [movies, ratings]);

  const toggleWatchlist = async (movie: Movie) => {
    if (!user) { setAuthMode('signin'); setPage('auth'); return; }
    const saved = watchlist.some((item) => item.movie_id === movie.id);
    if (saved) {
      const { error: deleteError } = await supabase.from('watchlist').delete().eq('movie_id', movie.id);
      if (!deleteError) setWatchlist((current) => current.filter((item) => item.movie_id !== movie.id));
    } else {
      const { data, error: insertError } = await supabase.from('watchlist').insert({ movie_id: movie.id }).select('movie_id').maybeSingle();
      if (!insertError && data) setWatchlist((current) => [...current, data as UserWatchlist]);
    }
  };

  const submitRating = async (movie: Movie, score: number) => {
    if (!user) { setAuthMode('signin'); setPage('auth'); return; }
    const { data, error: ratingError } = await supabase.from('ratings').upsert({ movie_id: movie.id, score }, { onConflict: 'user_id,movie_id' }).select('movie_id, score').maybeSingle();
    if (!ratingError && data) setRatings((current) => [...current.filter((item) => item.movie_id !== movie.id), data as Rating]);
  };

  if (page === 'auth') return <AuthPage mode={authMode} onModeChange={setAuthMode} onBack={() => setPage('home')} onSuccess={() => setPage('recommendations')} />;
  const savedIds = new Set(watchlist.map((item) => item.movie_id));
  const showMovies = page === 'recommendations' ? recommendedMovies : visibleMovies;

  return <div>
    <Navbar activePage={page === 'recommendations' ? 'recommendations' : 'home'} onNavigate={setPage} onSearch={setSearch} onAuth={() => { setAuthMode('signin'); setPage('auth'); }} />
    {page === 'home' && <HomeHero onBrowse={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })} onRecommendations={() => setPage('recommendations')} />}
    <main className="page-shell">
      {page === 'recommendations' ? <div className="recommend-hero"><span className="kicker">Your personal cinema guide</span><h1>Made for your taste.</h1><p>Discover stories that match the kind of cinema you already love. Rate a few movies and we will sharpen your picks over time.</p></div> : <section className="section"><div className="section-heading"><div><h2>Curated for the culture</h2><p>The best of Telugu cinema, in one place.</p></div><button onClick={() => setPage('recommendations')}>Personalize your picks <ArrowRight size={14} /></button></div></section>}
      {error && <div className="empty-state"><h3>Something went wrong</h3><p>{error}</p></div>}
      {page === 'home' && <section className="section" id="catalogue"><div className="section-heading"><div><h2>Browse by mood</h2><p>Find your next favorite story.</p></div></div><div className="genre-row">{genres.map((item) => <button key={item} className={`genre-pill ${genre === item ? 'selected' : ''}`} onClick={() => setGenre(item)}>{item}</button>)}</div></section>}
      <section className="section"><div className="section-heading"><div><h2>{page === 'recommendations' ? 'Picked for you' : search ? `Results for “${search}”` : genre === 'All' ? 'Trending now' : `${genre} stories`}</h2><p>{page === 'recommendations' ? (user ? 'Based on the movies you have rated.' : 'Sign in to make these picks truly yours.') : `${showMovies.length} Telugu films to explore.`}</p></div></div>{loading ? <div className="empty-state"><p>Loading your cinema shelf...</p></div> : <div className="movie-grid">{showMovies.length ? showMovies.map((movie) => <MovieCard key={movie.id} movie={movie} saved={savedIds.has(movie.id)} onSelect={setSelectedMovie} onToggleSave={toggleWatchlist} />) : <div className="empty-state"><h3>No films found</h3><p>Try another genre or search term.</p></div>}</div>}</section>
      {page === 'home' && <section className="section"><div className="section-heading"><div><h2>Your watchlist</h2><p>Keep the stories you want to see next close by.</p></div></div>{watchlist.length ? <div className="movie-grid">{movies.filter((movie) => savedIds.has(movie.id)).map((movie) => <MovieCard key={movie.id} movie={movie} saved onSelect={setSelectedMovie} onToggleSave={toggleWatchlist} />)}</div> : <div className="empty-state"><Bookmark size={22} /><h3>{user ? 'Your shelf is waiting' : 'Save films for later'}</h3><p>Sign in and tap the bookmark on any movie to build your watchlist.</p></div>}</section>}
    </main>
    {selectedMovie && <MovieModal movie={selectedMovie} saved={savedIds.has(selectedMovie.id)} userRating={ratings.find((item) => item.movie_id === selectedMovie.id)?.score ?? 0} onClose={() => setSelectedMovie(null)} onToggleSave={toggleWatchlist} onRate={submitRating} />}
  </div>;
}

function HomeHero({ onBrowse, onRecommendations }: { onBrowse: () => void; onRecommendations: () => void }) { return <section className="hero"><div className="hero-copy"><span className="kicker">Telugu stories. Curated beautifully.</span><h1>Every story has<br />a <em>feeling.</em></h1><p>Find the films that stay with you. ChitraBox brings the best of Telugu cinema together, so your next great watch is always close.</p><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><button className="primary-button" onClick={onBrowse}>Explore the collection <ArrowRight size={16} /></button><button className="secondary-button" onClick={onRecommendations}><Sparkles size={16} /> Get recommendations</button></div></div></section>; }

function AuthPage({ mode, onModeChange, onBack, onSuccess }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onBack: () => void; onSuccess: () => void }) {
  const { signIn, signUp } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(''); const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password); setBusy(false); if (result.error) setError(result.error.message); else onSuccess(); };
  return <><header className="navbar"><div className="nav-inner"><button className="brand" onClick={onBack}><span className="brand-mark"><Clapperboard size={20} /></span><span>CHITRA<span>BOX</span></span></button><button className="login-link" onClick={onBack}><ChevronLeft size={16} /> Back to explore</button></div></header><div className="auth-layout"><div className="auth-art"><span className="kicker">A home for Telugu cinema</span><h1>Stories worth coming back to.</h1><p>Build your personal shelf of unforgettable films and let ChitraBox find the next one for you.</p></div><div className="auth-panel"><h2>{mode === 'signin' ? 'Welcome back.' : 'Join ChitraBox.'}</h2><p>{mode === 'signin' ? 'Sign in to continue your cinematic journey.' : 'Create an account and start building your taste profile.'}</p><form className="auth-form" onSubmit={submit}><label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>{error && <div className="auth-error">{error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></button></form><p className="auth-switch">{mode === 'signin' ? 'New to ChitraBox?' : 'Already have an account?'} <button onClick={() => { onModeChange(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>{mode === 'signin' ? 'Create an account' : 'Sign in instead'}</button></p></div></div></>;
}

function MovieModal({ movie, saved, userRating, onClose, onToggleSave, onRate }: { movie: Movie; saved: boolean; userRating: number; onClose: () => void; onToggleSave: (movie: Movie) => void; onRate: (movie: Movie, score: number) => void }) { return <div className="detail-backdrop" onClick={onClose}><div className="detail-modal" onClick={(event) => event.stopPropagation()}><button className="close-modal" onClick={onClose}><X size={17} /></button><div className="detail-top" style={{ backgroundImage: `url(${movie.backdrop_url ?? movie.poster_url ?? ''})` }} /><div className="detail-body"><h2>{movie.title}</h2><div className="detail-info"><span>{movie.year}</span><span>•</span><span>{movie.runtime} min</span><span>•</span><strong><Star size={14} fill="currentColor" /> {movie.rating.toFixed(1)}</strong></div><div className="detail-tags">{movie.genres.map((item) => <span key={item}>{item}</span>)}</div><p>{movie.synopsis}</p><p style={{ color: '#898177', fontSize: 12 }}>Directed by <strong style={{ color: '#d8cbb8' }}>{movie.director}</strong> · Featuring {movie.lead_actors.join(', ')}</p><div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 23, flexWrap: 'wrap' }}><button className="primary-button" onClick={() => onToggleSave(movie)}>{saved ? <Check size={16} /> : <Bookmark size={16} />} {saved ? 'Saved to watchlist' : 'Add to watchlist'}</button><div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#958c80', fontSize: 12 }}>Your rating <span style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map((star) => <button key={star} onClick={() => onRate(movie, star)} style={{ padding: 2, border: 0, background: 'transparent', color: star <= userRating ? '#e9bd67' : '#61594f' }} aria-label={`Rate ${star} stars`}><Star size={17} fill="currentColor" /></button>)}</span></div></div></div></div></div>; }

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }
