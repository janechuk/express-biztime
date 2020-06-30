/** Routes about invoices. */
const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")


// GET / invoices Return info on invoices: like { invoices: [{ id, comp_code }, ...] }

router.get("/", async function (req, res, next) {
    try {
        const invQuery = await db.query(`SELECT id, comp_code FROM invoices`)
        return res.json({ invoices: invQuery.rows });
    } catch (err) {
        return next(err)
    }
});



// GET / invoices / [id] Returns obj on given invoice.Returns { invoice: { id, amt, paid, add_date, paid_date, company: { code, name, description } } }
router.get("/:id", async function (req, res, next) {
    try {
        const invQuery = await db.query(
            "SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id = $1", [req.params.id]);

        if (invQuery.rows.length === 0) {
            let notFoundError = new Error(`There is no invoice with id '${req.params.id}`);
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({ invoice: invQuery.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// POST / invoices Adds an invoice.Returns: { invoice: { id, comp_code, amt, paid, add_date, paid_date } }

router.post("/", async function (req, res, next) {
    try {
        let { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date) 
         VALUES ($1, $2) 
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]);

        return res.status(201).json({ invoice: result.rows[0] });  // 201 CREATED
    } catch (err) {
        return next(err);
    }
});


// PUT / invoices / [id]  Updates an invoice.Returns: { invoice: { id, comp_code, amt, paid, add_date, paid_date } }

router.put("/:id", async function (req, res, next) {
    try {
        let { amt, paid } = req.body;
        let id = req.params.id;
        let paidDate = null;

        const currResult = await db.query(
            `SELECT paid
           FROM invoices
           WHERE id = $1`,
            [id]);

        if (currResult.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        const currPaidDate = currResult.rows[0].paid_date;

        if (!currPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null
        } else {
            paidDate = currPaidDate;
        }

        const result = await db.query(
            `UPDATE invoices
           SET amt=$1, paid=$2, paid_date=$3
           WHERE id=$4
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]);

        return res.json({ invoice: result.rows[0] });
    }

    catch (err) {
        return next(err);
    }

});

// DELETE / invoices / [id] Deletes an invoice.Returns: { status: "deleted" }

router.delete("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;

        const result = await db.query(
            `DELETE FROM invoices
           WHERE id = $1
           RETURNING id`,
            [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        return res.json({ "status": "deleted" });
    }

    catch (err) {
        return next(err);
    }
});


module.exports = router;