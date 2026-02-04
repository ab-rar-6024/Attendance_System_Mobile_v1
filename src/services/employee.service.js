const pool = require('../config/db');

/**
 * Get all employees
 */
async function getAllEmployees() {
    const result = await pool.query(
        'SELECT id, name, emp_code FROM employee ORDER BY name'
    );
    return result.rows;
}

/**
 * Get employee by ID
 */
async function getEmployeeById(id) {
    const result = await pool.query(
        'SELECT id, name, emp_code, email, phone, department, designation FROM employee WHERE id = $1',
        [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get employee by emp_code
 */
async function getEmployeeByCode(empCode) {
    const result = await pool.query(
        'SELECT id, name, emp_code, email, phone, department, designation FROM employee WHERE emp_code = $1',
        [empCode]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get employee by PIN
 */
async function getEmployeeByPin(pin) {
    const result = await pool.query(
        'SELECT id, name, emp_code FROM employee WHERE pin = $1',
        [pin]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Add new employee
 */
async function addEmployee(name, empCode, password, pin) {
    await pool.query(
        'INSERT INTO employee(name, emp_code, password, pin) VALUES($1, $2, $3, $4)',
        [name, empCode, password, pin]
    );
}

/**
 * Delete employee
 */
async function deleteEmployee(id) {
    await pool.query('DELETE FROM employee WHERE id = $1', [id]);
}

/**
 * Search employees
 */
async function searchEmployees(query) {
    const like = `%${query}%`;
    const result = await pool.query(
        'SELECT id, name, emp_code FROM employee WHERE name ILIKE $1 OR emp_code ILIKE $2',
        [like, like]
    );
    return result.rows;
}

module.exports = {
    getAllEmployees,
    getEmployeeById,
    getEmployeeByCode,
    getEmployeeByPin,
    addEmployee,
    deleteEmployee,
    searchEmployees
};
