import { Bookmark, Check, Play, Star } from 'lucide-react';
import type { Movie } from '@/types';

type MovieCardProps = {
  movie: Movie;
  saved: boolean;
  onSelect: (movie: Movie) => void;
  onToggleSave: (movie: Movie) => void;
};

export function MovieCard({ movie, saved, onSelect, onToggleSave }: MovieCardProps) {
  return (
    <article className="movie-card group">
      <button className="poster-wrap" onClick={() => onSelect(movie)} aria-label={`View ${movie.title}`}>
        <img src={movie.poster_url ?? ''} alt={movie.title} className="poster-image" />
        <div className="poster-shade" />
        <span className="poster-play"><Play size={17} fill="currentColor" /></span>
        <span className="card-rating"><Star size={13} fill="currentColor" /> {movie.rating.toFixed(1)}</span>
      </button>
      <button className={`save-button ${saved ? 'saved' : ''}`} onClick={() => onToggleSave(movie)} aria-label={saved ? `Remove ${movie.title} from watchlist` : `Save ${movie.title} to watchlist`}>
        {saved ? <Check size={16} /> : <Bookmark size={16} />}
      </button>
      <div className="movie-card-copy">
        <h3>{movie.title}</h3>
        <div className="movie-meta"><span>{movie.year}</span><span className="dot" /><span>{movie.genres[0]}</span></div>
      </div>
    </article>
  );
}
