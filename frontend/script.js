async function getMovies() {
    const response = await fetch("http://localhost:3000/api/movies");
    const data = await response.json();
  
    const list = document.getElementById("movie-list");
    list.innerHTML = "";
  
    data.forEach(movie => {
      const li = document.createElement("li");
      li.textContent = movie.title + " - " + movie.genre;
      list.appendChild(li);
    });
  }