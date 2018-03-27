/*
# Commits features

## Setup

```javascript
const GitHubClient = require('../libs/GitHubClient.js').GitHubClient;
const commits = require('../libs/features/commits');

let githubCli = new GitHubClient({
  baseUri: "http://github.at.home/api/v3",
  token: process.env.TOKEN_GHITHUB_ENTERPRISE
}, commits); //<-- add commits features
```
*/

/*
## fetchCommitBySHA

- parameter: `sha, owner, repository`
- return: `Promise`

### Description

`fetchCommitBySHA` gets a commit by its sha

*/
function fetchCommitBySHA ({sha, owner, repository}) {
  return this.getData({path: `/repos/${owner}/${repository}/commits/${sha}`})
    .then(response => {
      return response.data
    })
}

function fetchAllCommits ({owner, repository, perPage = 20, page = 1, branch = 'master'}) {
  return this.getData({path: `/repos/${owner}/${repository}/commits?per_page=${perPage}&page=${page}&sha=${branch}`})
    .then(response => {
      return response.data
    })
    .catch(e => {
      console.log(e)
    })
}

module.exports = {
  fetchCommitBySHA: fetchCommitBySHA,
  fetchAllCommits: fetchAllCommits
}
