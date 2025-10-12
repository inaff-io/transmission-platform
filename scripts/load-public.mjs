#!/usr/bin/env node
import artillery from 'artillery';

const script = {
  config: {
    target: 'http://localhost:3000',
    phases: [
      { duration: 20, arrivalRate: 5 },
      { duration: 30, arrivalRate: 20 },
      { duration: 30, arrivalRate: 40 },
    ],
    defaults: { headers: { 'accept': 'application/json' } }
  },
  scenarios: [
    {
      name: 'UI blocks footer transmissao',
      flow: [
        { get: { url: '/api/ui/transmissao_footer' } },
        { get: { url: '/api/ui/transmission_footer' } },
        { get: { url: '/api/ui/programacao' } }
      ]
    }
  ]
};

(async () => {
  const runner = await artillery.runner(script, {});
  runner.on('phaseStarted', (opts) => console.log('Phase started', opts));
  runner.on('phaseCompleted', (opts) => console.log('Phase completed', opts));
  runner.on('done', (report) => {
    console.log('Done. Summary metrics:');
    console.log(JSON.stringify(report.aggregate, null, 2));
  });
  await runner.run();
})();