import React, { Component } from 'react'

import { FiMessageSquare } from 'react-icons/fi'

export default class CommitInfo extends Component {
  render () {
    const addition = (this.props.currentAdded !== 1) ? this.props.config.widget.commitList.additions : this.props.config.widget.commitList.addition
    const change = (this.props.currentChanged !== 1) ? this.props.config.widget.commitList.changes : this.props.config.widget.commitList.change
    const removal = (this.props.currentRemoved !== 1) ? this.props.config.widget.commitList.removals : this.props.config.widget.commitList.removal
    return (
      <div className='info'>
        <div className='msg'><FiMessageSquare /> <span>{this.props.currentMsg}</span></div>
        <div className='hash'><small>{this.props.currentCommitHash}</small></div>
        <div className='added'><span>{this.props.currentAdded} <small>{addition}</small>, {this.props.currentChanged} <small>{change}</small>, {this.props.currentRemoved} <small>{removal}</small> </span></div>
      </div>
    )
  }
}