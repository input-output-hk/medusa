function fetchTreeRecursive ({sha, owner, repository}) {
    return this.getData({path: `/repos/${owner}/${repository}/git/trees/${sha}?recursive=1`})
    .then(response => {
        return response.data
    })
}
  
module.exports = {
    fetchTreeRecursive: fetchTreeRecursive
}
  