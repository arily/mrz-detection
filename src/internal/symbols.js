module.exports = {

  MRZ: {
    symbols: [],
    label: 'mrz'
  }
};

for (let i = '0'.charCodeAt(0); i <= '9'.charCodeAt(0); i++) {
  module.exports.MRZ.symbols.push(i);
}
for (let i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++) {
  module.exports.MRZ.symbols.push(i);
}
module.exports.MRZ.symbols.push('<'.charCodeAt(0));

