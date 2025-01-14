import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123456",
  port: 5432,
};

async function visitedCountries() {
  try {
    let countries = [];

    const db = new pg.Client(dbConfig);
    await db.connect();
    
    const result = await db.query("SELECT country_code FROM visited_countries;");    
    result.rows.forEach(country => countries.push(country.country_code));

    await db.end();

    return countries;
  } catch(e) {
    console.error(e);
    return null;
  };
};

app.get("/", async (req, res) => {
  const countries = await visitedCountries();
  if (!countries) {
    res.status(500).send("Internal error!")
  } else {
    res.render("index.ejs", { 
      countries: countries,
      total: countries.length,
    });
  };
});

app.post("/add", async (req, res) => {
  let db = new pg.Client(dbConfig);
  try {
    await db.connect();

    const countrySubmitted = req.body["country"];
    const retrievedCountry = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [countrySubmitted.toLowerCase()]
    );
    const countryCode = retrievedCountry.rows[0].country_code;

    try {
      await db.query('INSERT INTO visited_countries (country_code) VALUES ($1);', [countryCode]);
      res.redirect(302, '/');
    } catch(e) {
      console.error(e);
      const countries = await visitedCountries();
      res.render('index.ejs', {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again with another one.",
      });
    };
  } catch (e) {
    console.error(e);
    const countries = await visitedCountries();
    res.render('index.ejs', {
      countries: countries,
      total: countries.length,
      error: "Country does not exists. Please try again."
    });
  } finally {
    if (db) {
      await db.end();
    };
  };
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
