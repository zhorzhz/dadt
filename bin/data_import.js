const DB = require('../db/connect')
const fs = require("fs");
const { parse } = require("csv-parse");

// set up the db client
const db = new DB({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'data_importer',
    password        : 'supersafe',
    database        : 'movieworld'
})

// set up the connection
db.connect();

// Fill imdb data into imdb table
// fs.createReadStream("../data-source/imdb_top_1000.csv")
// .pipe(parse({ delimiter: ",", from_line: 2 }))
// .on("data", function (row) {
//     db.pool.query('INSERT INTO movieworld.imdb (title, rating) VALUES (?, ?)', [row[1], row[6]], function (error, results, fields) {
//         if (error) {
// //             console.error(error)
//         }
//     });
// })
// .on("end", function () {
//     console.log("finished");
// })
// .on("error", function (error) {
//     console.log(error.message);
// });

// Fill provider movie data into movies table
let moviesData = [
    {
        csvName: "amazon_prime_titles.csv",
        providerName: "amazon",
        movies: []
    },
    {
        csvName: "disney_plus_titles.csv",
        providerName: "disney",
        movies: []
    },
    {
        csvName: "hulu_titles.csv",
        providerName: "hulu",
        movies: []
    },
    {
        csvName: "netflix_titles.csv",
        providerName: "netflix",
        movies: []
    }
]

const genresMapping = {
    "Action": "Action",
    "Action & Adventure": "Action",
    "Action-Adventure": "Action",
    "Adult Animation": "Animation",
    "Adventure": "Adventure",
    "Culture": "Culture",
    "Animals & Nature": "Animals & Nature",
    "Animation": "Animation",
    "Anime": "Anime",
    "Anime Features": "Anime",
    "Anime Series": "Anime",
    "Anthology": "Anthology",
    "Arthouse": "Arthouse",
    "Arts": "Arts",
    "Biographical": "Biographical",
    "Black Stories": "Black Stories",
    "British TV Shows": "TV Shows",
    "Buddy": "Buddy",
    "Cartoons": "Animation",
    "Children & Family Movies": "Family",
    "Classic & Cult TV": "Classic",
    "Classic Movies": "Classic",
    "Classics": "Classic",
    "Comedies": "Comedy",
    "Comedy": "Comedy",
    "Coming of Age": "Coming of Age",
    "Concert Film": "Concert Film",
    "Cooking & Food": "Cooking & Food",
    "Crime": "Crime",
    "Crime TV Shows": "Crime",
    "Cult Movies": "Culture",
    "Dance": "Dance",
    "Disaster": "Disaster",
    "Documentaries": "Documentary",
    "Documentary": "Documentary",
    "Docuseries": "Documentary",
    "Drama": "Drama",
    "Dramas": "Drama",
    "Entertainment": "Entertainment",
    "Faith & Spirituality": "Faith and Spirituality",
    "Faith and Spirituality": "Faith and Spirituality",
    "Family": "Family",
    "Fantasy": "Fantasy",
    "Fitness": "Fitness",
    "Game Show / Competition": "Game Show",
    "Game Shows": "Game Show",
    "Health & Wellness": "Health & Wellness",
    "Historical": "History",
    "History": "History",
    "Horror": "Horror",
    "Horror Movies": "Horror",
    "Independent Movies": "Independent Movies",
    "International": "International",
    "International Movies": "International",
    "International TV Shows": "International",
    "Kids": "Kids",
    "Kids TV": "Kids",
    "Korean TV Shows": "Korean",
    "Late Night": "Late Night",
    "Latino": "Latino",
    "LGBTQ": "LGBTQ",
    "LGBTQ Movies": "LGBTQ",
    "LGBTQ+": "LGBTQ",
    "Lifestyle": "Lifestyle",
    "Lifestyle & Culture": "Lifestyle",
    "Medical": "Medical",
    "Military and War": "Military and War",
    "Movies": "Movies",
    "Music": "Music",
    "Music & Musicals": "Music",
    "Music Videos and Concerts": "Music",
    "Musical": "Music",
    "Mystery": "Mystery",
    "News": "News",
    "Parody": "Parody",
    "Police/Cop": "Police/Cop",
    "Reality": "Reality",
    "Reality TV": "Reality",
    "Romance": "Romance",
    "Romantic Comedy": "Romance",
    "Romantic Movies": "Romance",
    "Romantic TV Shows": "Romance",
    "Sci-Fi & Fantasy": "Sci-Fi",
    "Science & Nature TV": "Sci-Fi",
    "Science & Technology": "Sci-Fi",
    "Science Fiction": "Sci-Fi",
    "Series": "Series",
    "Sitcom": "Sitcom",
    "Sketch Comedy": "Sketch Comedy",
    "Soap Opera / Melodrama": "Soap Opera",
    "Spanish-Language TV Shows": "Spanish",
    "Special Interest": "Special Interest",
    "Sports": "Sports",
    "Sports Movies": "Sports",
    "Spy/Espionage": "Spy",
    "Stand Up": "Stand Up",
    "Stand-Up Comedy": "Stand Up",
    "Stand-Up Comedy & Talk Shows": "Stand Up",
    "Superhero": "Superhero",
    "Survival": "Survival",
    "Suspense": "Suspense",
    "Talk Show": "Talk Show",
    "Talk Show and Variety": "Talk Show",
    "Teen": "Teen",
    "Teen TV Shows": "Teen",
    "Thriller": "Thriller",
    "Thrillers": "Thriller",
    "Travel": "Travel",
    "TV Action & Adventure": "Adventure",
    "TV Comedies": "Comedy",
    "TV Dramas": "Drama",
    "TV Horror": "Horror",
    "TV Mysteries": "Mystery",
    "TV Sci-Fi & Fantasy": "Sci-Fi",
    "TV Shows": "TV Shows",
    "TV Thrillers": "Thriller",
    "Unscripted": "Unscripted",
    "Variety": "Variety",
    "Western": "Western",
    "Young Adult Audience": "Teen"
}

function readMoviesFromCSV() {
    let promises = []
    moviesData.forEach((data) => {
        promises.push(new Promise((resolve) => {
            fs.createReadStream("../data-source/"+data.csvName)
            .pipe(parse({ delimiter: ",", from_line: 2 }))
            .on("data", function (row) {
                data.movies.push(row)
            })
            .on("end", function () {
                console.log("finished reading "+ data.csvName);
                resolve()
            })
            .on("error", function (error) {
                console.log(error.message);
            });
        }))
    })

    return Promise.all(promises)
}

async function insertMovies() {
    let promises = []
    for (let providerMovieData of moviesData) {
        for (let movieData of providerMovieData.movies) {
            await new Promise(async (resolve, reject)=>{
                db.pool.query("INSERT INTO movieworld.movies (title) VALUES (?)", [movieData[2]], function (error, results, fields) {
                    if (error) {
                        // console.error(error)
                    }

                    db.pool.query("SELECT id FROM movieworld.movies WHERE title = ?", [movieData[2]], function (error, results, fields) {
                        if (error) {
                            // console.error(error)
                        }

                        db.pool.query(
                            "INSERT INTO movieworld.movies_providers (movie_id, provider_id) VALUES (?, (SELECT id FROM movieworld.providers WHERE name = ?))",
                            [results[0].id, providerMovieData.providerName],
                            async function (error) {
                                if (error) {
                                    // console.error(error)
                                }

                                await addMovieGenres(results[0].id, movieData)

                                resolve()
                            });
                    })
                })
            })
        }
    }

    return Promise.all(promises)
}

function cleanupGenreName(name) {
    return genresMapping[name] || "Other"
}

async function addMovieGenres(movieID, movieData) {
    let movieGenres = movieData[10].split(',')

    for (let movieGenre of movieGenres) {
        movieGenre = movieGenre.trim()
        await new Promise((resolve) => {
            db.pool.query("INSERT INTO movieworld.genres (name) VALUES (?)", [cleanupGenreName(movieGenre)], async function (error) {
                if (error) {
                    // console.error(error)
                }

                db.pool.query("SELECT * FROM movieworld.genres WHERE name = ?", [cleanupGenreName(movieGenre)], async function (error, result) {
                    if (error) {
                        // console.error(error)
                    }

                    // console.log(movieGenre, result)
                    db.pool.query("INSERT INTO movieworld.movies_genres (movie_id, genre_id) VALUES (?, ?)", [movieID, result[0].id], async function (error, result) {
                        if (error) {
                            // console.error(error)
                        }

                        resolve()
                    });
                });
            });
        })
    }
}

async function main() {
    await readMoviesFromCSV()
    await insertMovies();
    console.log("All done")
}

main()

