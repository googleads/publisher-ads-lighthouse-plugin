/**
 * Returns object for a notApplicable audit given a message string
 * @param {string} message
 * @return {Object}
 */
function auditNotApplicable(message = 'Audit not applicable.') {
  return {
    notApplicable: true,
    rawValue: true,
    displayValue: message,
  };
}

module.exports = {auditNotApplicable};
