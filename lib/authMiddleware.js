export const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    const returnTo = encodeURIComponent(req.originalUrl);
    res.redirect(`/login?returnTo=${returnTo}`);
};

export const isAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        return next();
    }
    if (req.session.userId) {
        return res.redirect('/');
    }
    const returnTo = encodeURIComponent(req.originalUrl);
    res.redirect(`/login?returnTo=${returnTo}`);
};
