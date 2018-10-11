const request = require('supertest');

describe('loading express', function () {
  const server = request('http://localhost:3000')

  it('responds to /', done => {
    server
      .get('/')
      .expect(200, done)
  });

  it('responds to /statics', done => {
    server
      .get('/')
      .expect(200, done)
  });

  it('responds to logs', done => {
    server
      .post('/logs')
      .set('Content-Type', 'application/json')
      .send('{"key":"value"}')
      .expect(204, done)
  });

  it('responds to events and update metrics', done => {
    server
      .post('/events')
      .set('Content-Type', 'application/json')
      .send('{"type":"favorite_saved"}')
      .expect(204, () => {
        server
          .get('/metrics')
          .expect(200)
          .expect(/erdapfel_favorite_saved 1/, done)
      })
  });

  it('refuses unknown events', done => {
    server
      .post('/events')
      .set('Content-Type', 'application/json')
      .send('{"type":"unknown"}')
      .expect(400, done)
  });

});
