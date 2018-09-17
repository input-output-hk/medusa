import React, { Component } from 'react'

export default class Sidebar extends Component {
  render () {
    if (this.props.config.display.showSidebar) {
      return (
        <div className='gource-wrap'>
          <div className='commit--switcher'>
            <b>All commits</b>
            <a onClick={this.props.goToPrev} className='prev' title='Previous commit'>Previous<em className='icon-arrow-down' /></a>
            <a onClick={this.props.goToNext} className='next' title='Next commit'>Next<em className='icon-arrow-up' /></a>
          </div>
          <ol className='gource-sidebar'>
            {this.props.sideBarCommits.map((commit) =>
              <li key={commit.sha}
                className={commit.index === this.props.sidebarCurrentCommitIndex ? 'current' : ''}
                onClick={() => { this.props.loadCommit(commit.sha) }}>
                <div className='sidebar-gravatar'>
                  <img src={commit.gravatar} width='40' height='40' alt='' />
                </div>
                <div className='sidebar-details'>
                  <p>
                    <span className='sidebar-author'>{commit.author}</span> <span className='sidebar-date' title={commit.dateLong}>{commit.dateShort}</span>
                    <a className='sidebar-github-view' target='_blank' title='View Commit on GitHub' href={'https://github.com/' + this.props.config.git.owner + '/' + this.props.config.git.repo + '/commit/' + commit.sha}>
                  View on GitHub
                    </a>
                  </p>
                  <p>
                    <span className='sidebar-message'>
                      {commit.msg}
                    </span>
                  </p>
                </div>
              </li>
            )}
          </ol>
        </div>
      )
    }
  }
}
