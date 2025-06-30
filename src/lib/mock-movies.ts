import { type Movie } from "./types";

const movies: Movie[] = [
    { 
        id: 'mov1', 
        title: 'Cyber City 2049', 
        description: 'In a neon-drenched metropolis of the future, a lone detective uncovers a conspiracy that threatens to unravel the fabric of society.',
        youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        genre: 'Sci-Fi',
        language: 'English',
        posterUrl: 'https://placehold.co/400x600.png'
    },
     { 
        id: 'mov2', 
        title: 'The Last Romance', 
        description: 'Two old flames reunite after fifty years, discovering that some feelings never fade away, even when memories do.',
        youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        genre: 'Romance',
        language: 'Hindi',
        posterUrl: 'https://placehold.co/400x600.png'
    },
    { 
        id: 'mov3', 
        title: 'Echoes of the Past', 
        description: 'A historian buys an old house and starts experiencing visions of a tragic event that occurred there a century ago.',
        youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        genre: 'Thriller',
        language: 'Tamil',
        posterUrl: 'https://placehold.co/400x600.png'
    },
    { 
        id: 'mov4', 
        title: 'King\'s Gambit', 
        description: 'The epic tale of a young warrior\'s rise to power in a mythical kingdom, filled with battles, betrayal, and glory.',
        youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        genre: 'Action',
        language: 'Telugu',
        posterUrl: 'https://placehold.co/400x600.png'
    },
];

const initializeLocalStorage = () => {
  if (typeof window !== "undefined") {
    if (!localStorage.getItem("movies")) {
      localStorage.setItem("movies", JSON.stringify(movies));
    }
  }
};

initializeLocalStorage();

export const getMovies = (): Movie[] => {
  if (typeof window !== "undefined") {
    const localMovies = localStorage.getItem("movies");
    if (localMovies) {
      try {
        return JSON.parse(localMovies);
      } catch (e) {
        console.error("Failed to parse movies from localStorage", e);
        localStorage.setItem("movies", JSON.stringify(movies));
        return movies;
      }
    }
    localStorage.setItem("movies", JSON.stringify(movies));
  }
  return movies;
};

export const getMovieById = (id: string): Movie | undefined => {
  const allMovies = getMovies();
  return allMovies.find(movie => movie.id === id);
}

export const addMovie = (movieData: Omit<Movie, 'id'>) => {
    if (typeof window !== 'undefined') {
        const allMovies = getMovies();
        const newMovie: Movie = {
            id: `mov-${Date.now()}`,
            ...movieData,
        };
        allMovies.push(newMovie);
        localStorage.setItem('movies', JSON.stringify(allMovies));
    }
};
