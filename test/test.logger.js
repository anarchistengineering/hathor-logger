const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Code.expect;

const {
  Logger
} = require('../');

describe('logger', ()=>{
  it('Should be able to create an instance', (done)=>{
    const logger = new Logger();
    return done();
  });

  it('Should be able to use a custom output handler', (done)=>{
    const logger = new Logger({
      outputHandler(pkt, complete){
        expect(pkt).to.be.an.object();
        expect(pkt.data).to.be.an.array();
        expect(pkt.data[0]).to.equal('test');
        expect(complete).to.be.an.object();
        expect(complete.data).to.be.an.array();
        expect(complete.data[0]).to.equal('test');
        done();
      }
    });
    logger.info('test');
  });
});
