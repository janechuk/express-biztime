/** Routes about companies. */
const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

// GET / companies Returns list of companies, like { companies: [{ code, name }, ...] }

router.get("/", async function (req, res, next) {
    try {
        const compQuery = await db.query(`SELECT code, name FROM companies`)
        return res.json({ companies: compQuery.rows });
    } catch (err) {
        return next(err)
    }
});

// GET / companies / [code] Return obj of company: { company: { code, name, description } }

router.get("/:code", async function (req, res, next) {
    try {
        const compQuery = await db.query(
            "SELECT code, name FROM companies WHERE code = $1", [req.params.code]);

        if (compQuery.rows.length === 0) {
            let notFoundError = new Error(`There is no company with code '${req.params.code}`);
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({ company: compQuery.rows[0] });
    } catch (err) {
        return next(err);
    }
});


// POST / companies Returns obj of new company: { company: { code, name, description } }

router.post("/", async function (req, res, next) {
    try {
        let { name, description } = req.body;
        let code = slugify(name, { lower: true });
        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
         VALUES ($1, $2, $3) 
         RETURNING code, name, description`,
            [code, name, description]);

        return res.status(201).json({ company: result.rows[0] });  // 201 CREATED
    } catch (err) {
        return next(err);
    }
});

// PUT / companies / [code] Edit existing company.Returns update company object: { company: { code, name, description } }

router.put("/:code", async function (req, res, next) {
    try {

        let { name, description } = req.body;
        let code = req.params.code;
        const result = await db.query(
            `UPDATE companies 
           SET name=$1, description=$2
           WHERE code = $3
           RETURNING code, name, description`,
            [name, description, code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
        }

        return res.json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});


// DELETE / companies / [code] Deletes company.  Returns { status: "deleted" }

router.delete("/:code", async function (req, res, next) {
    try {
        const result = await db.query(
            "DELETE FROM companies WHERE code = $1 RETURNING id", [req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});



module.exports = router;