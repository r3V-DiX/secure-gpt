const panRegex = /\b([A-Z]{3}[PCHFATBLJG][A-Z]\s*[0-9OIS]{4}\s*[A-Z])\b/gi
const text = 'NCPPK0135A'
const match = panRegex.exec(text)
console.log('Match:', match)
