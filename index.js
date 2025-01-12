import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123456",
  port: 5432,
});

app.get("/", async (req, res) => {
  try {
    await db.connect();
    
    const result = await db.query("SELECT country_code FROM visited_countries;");
    let countries = [];

    result.rows.forEach(country => countries.push(country.country_code));

    await db.end();

    res.render("index.ejs", { 
      total: countries.length,
      countries: countries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Request failed!");
  };
});

app.post("/add", async (req, res) => {
  try {
    await db.connect();

    const countrySubmitted = req.body["country"];
    const retrievedCountry = await db.query('SELECT country_code FROM countries WHERE country_name = $1;', [countrySubmitted]);

    if (retrievedCountry.rows.length === 0) {
      res.status(404).send("Country not found!");
    };

    const countryCode = retrievedCountry.rows[0].country_code;
    await db.query('INSERT INTO visited_countries (country_code) VALUES ($1);', [countryCode]);

    await db.end();

    res.redirect(302, '/');
  } catch (err) {
    console.error("Query failed with: ", err);
    res.status(500).send("Request failed!");
  };
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
