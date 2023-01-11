var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    global.db.pool.query('SELECT * FROM movieworld.providers;', (error, result) => {
        global.db.pool.query(`
            SELECT p.name as 'provider_name', count(i.id) as 'count' FROM movies
            JOIN movies_providers mp on movies.id = mp.movie_id
            JOIN imdb i on movies.title = i.title
            JOIN providers p on mp.provider_id = p.id
            GROUP BY p.id
        `, (error, imdbResult) => {
            global.db.pool.query(`
                SELECT genre_id, count(*) as 'count' FROM movieworld.movies_genres
                GROUP BY genre_id
                ORDER BY count(*) DESC
                LIMIT 12
            `, [], (error, topGenres) => {
                global.db.pool.query(`
                    SELECT genres.name as 'genre', p.name as 'provider', count(mp.movie_id) as 'count' FROM genres
                    JOIN movies_genres mg on genres.id = mg.genre_id
                    JOIN movies_providers mp on mg.movie_id = mp.movie_id
                    JOIN providers p on mp.provider_id = p.id
                    WHERE genres.id IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    GROUP BY genres.name, mp.provider_id
                `, topGenres.map((o) => o.genre_id), (error, genresResult) => {
                    res.render('index', {
                        providers: result,
                        imdbData: imdbResult,
                        genresData: genresResult
                    });
                })
            })
        })
    })
});

router.get('/provider_details', function(req, res, next) {
    const providerID = req.query.provider_id
    global.db.pool.query(`
        SELECT i.rating, count(movies.id) AS 'count' FROM movieworld.movies
        JOIN movies_providers mp on movies.id = mp.movie_id
        JOIN imdb i on movies.title = i.title
        WHERE mp.provider_id = ?
        GROUP BY i.rating;
    `, [providerID], (error, result) => {
        res.render('provider_details', { data: result });
    })
});

module.exports = router;
