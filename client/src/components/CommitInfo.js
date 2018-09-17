import React, { Component } from 'react'

export default class CommitInfo extends Component {
  render () {
    return (
      <div className='info'>
        <div className='currentAdded'><span>Files Added:</span> <b>{this.props.currentAdded}</b></div>
        <div className='currentChanged'><span>Files Changed:</span> <b>{this.props.currentChanged}</b></div>
        <div className='currentRemoved'><span>Files Removed:</span> <b>{this.props.currentRemoved}</b></div>
        <div className='currentAuthor'><span>Author:</span> <b>{this.props.currentAuthor}</b></div>
        <div className='currentMsg'><span>Message:</span> <b>{this.props.currentMsg}</b></div>
        <div className='currentDate'><span>Commit Date:</span> <b>{this.props.currentDate}</b></div>
        <div className='currentCommitHash'><span>Commit Hash:</span> <b>{this.props.currentCommitHash}</b></div>
      </div>
    )
  }
}
