/**
 * Authentication middleware
 * Equivalent to Python's @protect decorator
 */
function protect(key) {
    return (req, res, next) => {
        if (!req.session || !req.session[key]) {
            return res.redirect('/login');
        }
        next();
    };
}

/**
 * Check if user is admin
 */
function isAdmin(req, res, next) {
    if (!req.session || !req.session.admin) {
        return res.redirect('/login');
    }
    next();
}

/**
 * Check if user is employee
 */
function isEmployee(req, res, next) {
    if (!req.session || !req.session.emp_id) {
        return res.redirect('/login');
    }
    next();
}

module.exports = {
    protect,
    isAdmin,
    isEmployee
};
