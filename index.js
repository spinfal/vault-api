const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fetch = require('node-fetch');
const app = express();

/* setup server */
const originSite = 'https://vault.spinfal.repl.co';
const corsOptions = {
    origin: originSite
}
app.use(cors());

const limit = rateLimit({
  max: 15,// max requests
  windowMs: 10000,
  message: 'You are being ratelimited.'
});

app.use(helmet());

app.use(express.json({ limit: '700kb' }));

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

const _PORT = process.env['PORT'];
app.listen(_PORT, () => {
    console.log(`up and running using port ${_PORT}!`);
})

/* setup frontend */
app.get('/', (req, res) => {
  res.sendFile('public/index.html');
});

app.get('/status', (req, res) => {
  const user = req.query.user;
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${process.env['APIKEY']}/basket/${user}`).then(pantryRes => res.sendStatus(pantryRes.status));
})

// get json from pantry
app.get('/get', limit, async(req, res) => {
  if (req.headers.origin !== originSite) return res.json(`{"error": "This API was built for ${originSite}"}`);
  const user = req.headers.user;
  
  let _method = fetch(`https://getpantry.cloud/apiv1/pantry/${process.env['APIKEY']}/basket/${user}`);
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${process.env['APIKEY']}/basket/${user}`,{method:"GET"}).then(pantryRes => pantryRes.json()).then(pantryRes => {
    res.json((_method.status == 400) ? res.sendStatus(400) : pantryRes);
  });
});

// post data to pantry
app.post('/post', limit, (req, res) => {
  if (req.headers.origin !== originSite) return res.json(`{"error": "This API was built for ${originSite}"}`);
  const user = req.query.user;
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${process.env['APIKEY']}/basket/${user}`,{method:"POST",headers:{'Content-Type': 'application/json'},body:JSON.stringify(req.body)}).then(() => {
    res.sendStatus(204);
  }).catch(e => res.json(`{"error": "${e}"}`));
});

// put data to pantry
app.put('/put', limit, (req, res) => {
  if (req.headers.origin !== originSite) return res.json(`{"error": "This API was built for ${originSite}"}`);
  const user = req.query.user;
  const keyName = req.query.keyName;
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${process.env['APIKEY']}/basket/${user}`,{method:"PUT",headers:{'Content-Type': 'application/json'},body:JSON.stringify({[keyName]:toBase64(req.body[keyName])})}).then(() => {
    res.sendStatus(204);
  }).catch(e => res.json(`{"error": "${e}"}`));
});

function toBase64(text) {
  const buff = Buffer.from(text, 'utf-8');
  const value = buff.toString('base64');
  return value;
}