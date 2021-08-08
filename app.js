const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

// Initialize DB and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Get list of states
app.get("/states/", async (request, response) => {
  const getStatesDetails = `
        SELECT 
            state_id as stateId,
            state_name as stateName,
            population as population
        FROM 
            state;`;
  const statesArray = await db.all(getStatesDetails);
  response.send(statesArray);
});

// Get state details for the given id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetails = `
        SELECT 
            state_id as stateId,
            state_name as stateName,
            population as population
        FROM
            state
        WHERE 
            state_id = ${stateId};`;
  const stateDetails = await db.get(getStateDetails);
  response.send(stateDetails);
});

//Post the given state details
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictDetails = `
        INSERT INTO 
            district 
                (
                    district_name,
                    state_id,
                    cases,
                    cured,
                    active,
                    deaths
                )
        VALUES 
            (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            );`;
  await db.run(postDistrictDetails);
  response.send("District Successfully Added");
});

// Get district for the given district id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
        SELECT 
            district_id as districtId,
            district_name as districtName,
            state_id as stateId,
            cases,
            cured,
            active,
            deaths
        FROM 
            district
        WHERE 
            district_id = ${districtId};`;
  const districtDetails = await db.get(getDistrictDetails);
  response.send(districtDetails);
});

// Delete district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
        DELETE FROM 
            district 
        WHERE 
            district_id = ${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

// Put district details
app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const { districtId } = request.params;
  const putDistrictDetails = `
        UPDATE 
            district 
        SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE 
            district_id = ${districtId};`;
  await db.run(putDistrictDetails);
  response.send("District Details Updated");
});

// Get stats of cases
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStats = `
        SELECT 
            SUM(cases) as totalCases,
            SUM(cured) as totalCured,
            SUM(active) as totalActive,
            SUM(deaths) as totalDeaths
        FROM 
            district
        WHERE 
            state_id = ${stateId};`;
  const stateStats = await db.get(getStats);
  response.send(stateStats);
});

// state name of the district
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateOfDistrict = `
        SELECT 
            state_name as stateName
        FROM 
            district INNER JOIN state 
            ON district.state_id = state.state_id
        WHERE 
            district_id = ${districtId};`;
  const districtState = await db.get(getStateOfDistrict);
  response.send(districtState);
});
