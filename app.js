const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3007, () => {
      console.log("Server Running at http://localhost:3007/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbobjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1 retuen all states

app.get("/states/", async (request, response) => {
  const stateNameQuery = `
    SELECT 
     *
     FROM 
     state`;

  const allStaeArray = await db.all(stateNameQuery);
  response.send(
    allStaeArray.map((eachObject) =>
      convertDbobjectToResponseObject(eachObject)
    )
  );
});

//API 2 return a state on statedId
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
    *
    FROM 
    state 
    WHERE 
    state_id = ${stateId};`;

  const stateDetails = await db.get(getStateQuery);
  response.send(convertDbobjectToResponseObject(stateDetails));
});

//API 3 create a district

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addStateQuery = `
    INSERT INTO
     district (district_name, state_id,cases, cured, active, deaths)
     VALUES(
         '${districtName}',
         '${stateId}',
         '${cases}',
         '${cured}',
         '${active}',
         '${deaths}'

     ) ;`;

  await db.run(addStateQuery);
  response.send("District Successfully Added");
});

//API 4 Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
    *
    FROM 
    district
    WHERE 
    district_id = ${districtId};`;

  const districtArray = await db.get(getDistrictQuery);
  response.send(convertDbobjectToResponseObject(districtArray));
});

//API 5 Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
    district 
    WHERE 
    district_id = ${districtId};`;

  await db.run(deleteDistrictQuery);

  response.send("District Removed");
});

//API 6 update the district details

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrict = `
    UPDATE
     district
     SET 
     district_id = '${districtId}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
     WHERE 
     district_id = ${districtId};`;

  await db.run(updateDistrict);

  response.send("District Details Updated");
});

//API 7 return stats

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM district
    WHERE 
      state_id = ${stateId};`;

  const stats = await db.run(getStateStatsQuery);
  //console.log(stats);
  response.send(stats);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuery2 = `
   SELECT state_name
   FROM state
     NATURAL JOIN district 
     WHERE district_id = ${districtId};`;

  const stateName = await db.run(stateQuery2);
  response.send(convertDbobjectToResponseObject(stateName));
});

module.exports = app;
