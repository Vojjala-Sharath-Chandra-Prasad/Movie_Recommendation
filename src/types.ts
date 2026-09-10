export type Movie = {
  id: string;
  title: string;
  year: number | null;
  director: string | null;
  lead_actors: string[];
  genres: string[];
  language: string;
  rating: number;
  runtime: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  synopsis: string | null;
};

export type Rating = {
  movie_id: string;
  score: number;
};

export type UserWatchlist = {
  movie_id: string;
};
