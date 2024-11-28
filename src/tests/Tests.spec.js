import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getDurationTrend = new Trend('get_duration', true);
export const statusCodeOkRate = new Rate('status_code_200');

export const options = {
  thresholds: {
    get_duration: ['p(95)<5700'],
    http_req_failed: ['rate<0.12'],
    status_code_200: ['rate>0.95']
  },
  stages: [
    { duration: '1m', target: 10 },
    { duration: '1m', target: 60 },
    { duration: '1m', target: 130 },
    { duration: '1m', target: 250 },
    { duration: '1m', target: 300 },
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://uselessfacts.jsph.pl/api/v2/facts/random';

  const params = {
    timeout: '60s',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const res = http.get(`${baseUrl}`, params);

  getDurationTrend.add(res.timings.duration);
  statusCodeOkRate.add(res.status === 200);

  // Validação código 200
  check(res, {
    'GET Random Useless Facts - 200': () => res.status === 200
  });
}