const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fetch = require('node-fetch');
const app = express()
const config = require('./config.json');

/* setup server */
const originSite = config.originSite;
const maxRequests = config.maxRequests;
const windowMs = config.windowMs;
const maxPayloadSize = config.maxPayloadSize;
const _PORT = config.port;
const pantryKEY = (config.pantryKEY.length == 36) ? config.pantryKEY : process.env['APIKEY'];

const corsOptions = {
    origin: originSite
}
app.use(cors(corsOptions));

const limit = rateLimit({
  max: maxRequests,// max requests
  windowMs: windowMs,
  message: 'You are being ratelimited.'
});

app.use(helmet());

app.use(express.json({ limit: maxPayloadSize }));

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.listen(_PORT, () => {
    console.log(`up and running using port ${_PORT}!`);
})

/* setup frontend */
app.get('/', (req, res) => {
  res.sendFile('public/index.html');
});

app.get('/status', (req, res) => {
  const user = req.query.user;
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${pantryKEY}/basket/${user}`).then(pantryRes => {
    console.log(`request /status - ${pantryRes.status}`)
    res.sendStatus(pantryRes.status);
  });
})

// get json from pantry
app.get('/get', limit, async(req, res) => {
  if (req.headers.origin !== originSite) return res.json(`This API was built for ${originSite}`);
  const user = req.headers.user;
  
  let _method = await fetch(`https://getpantry.cloud/apiv1/pantry/${pantryKEY}/basket/${user}`);
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${pantryKEY}/basket/${user}`,{method:"GET"}).then(pantryRes => pantryRes.json()).then(pantryRes => {
    console.log(`request /get - ${_method.status}`);
    res.json((_method.status == 400) ? res.sendStatus(400) : pantryRes);
  });
});

// post data to pantry
app.post('/post', limit, (req, res) => {
  if (req.headers.origin !== originSite) return res.json(`This API was built for ${originSite}`);
  const user = req.query.user;
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${pantryKEY}/basket/${user}`,{method:"POST",headers:{'Content-Type': 'application/json'},body:JSON.stringify(req.body)}).then(postRes => {
    console.log(`request /post - ${postRes.status}`);
    res.sendStatus(postRes.status);
  }).catch(e => res.json(`{"error": "${e}"}`));
});

// put data to pantry
app.put('/put', limit, (req, res) => {
  if (req.headers.origin !== originSite) return res.json(`This API was built for ${originSite}`);
  const user = req.query.user;
  const keyName = req.query.keyName;
  
  fetch(`https://getpantry.cloud/apiv1/pantry/${pantryKEY}/basket/${user}`,{method:"PUT",headers:{'Content-Type': 'application/json'},body:JSON.stringify({[keyName]:toBase64(req.body[keyName])})}).then(putRes => {
    console.log(`request /put - ${putRes.status}`);
    res.sendStatus(putRes.status);
  }).catch(e => res.json(`{"error": "${e}"}`));
});

function toBase64(text) {
  const buff = Buffer.from(text, 'utf-8');
  const value = buff.toString('base64');
  return value;
}