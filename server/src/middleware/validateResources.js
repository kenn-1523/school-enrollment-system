const validate = (schema) => (req, res, next) => {
  try {
    // This checks req.body against your Zod schema rules
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // If data is valid, let the request continue
    next();
  } catch (e) {
    // If data is invalid, stop here and send error
    return res.status(400).json({
      message: "Validation Error",
      errors: e.errors 
    });
  }
};

module.exports = validate;