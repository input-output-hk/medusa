import React, { Component } from 'react'
import Widget from '../components/Widget'
import CommitInfo from './CommitInfo'

export default class CommitList extends Component {

            //
            // <CommitInfo
            //   currentAdded={this.props.currentAdded}
            //   currentChanged={this.props.currentChanged}
            //   currentRemoved={this.props.currentRemoved}
            //   currentAuthor={this.props.currentAuthor}
            //   currentMsg={this.props.currentMsg}
            //   currentDate={this.props.currentDate}
            //   currentCommitHash={this.props.currentCommitHash}
            // />
                      //
                      // <div className="card-body">
                      //   <div className='commit--switcher'>
                      //     <a onClick={this.props.goToPrev} className='prev' title='Previous commit'>Previous<em className='icon-arrow-down' /></a>
                      //     <a onClick={this.props.goToNext} className='next' title='Next commit'>Next<em className='icon-arrow-up' /></a>
                      //   </div>
                      // </div>

  render () {
    if (this.props.config.display.showSidebar) {
      return (
        <Widget title={this.props.title} slug={this.props.slug} list={"true"}>

          <ul className="list-group list-group-flush">
            {this.props.sideBarCommits.map((commit) =>
              <li key={commit.sha}
                className={commit.index === this.props.sidebarCurrentCommitIndex ? 'list-group-item bg-transparent current' : 'list-group-item bg-transparent'}
                onClick={() => { this.props.loadCommit(commit.sha) }}>
                <div className="row">
                  <div className="col-4">
                    <img src={commit.gravatar} className="rounded-circle" width='40' height='40' alt='' />
                  </div>
                  <div className="col-20">
                    <h5 className="m-0">{commit.author}</h5>
                    <small>
                      <span className='date' title={commit.dateLong}>{commit.dateShort}</span>, &nbsp;
                      <a className='github' target='_blank' title='View Commit on GitHub' href={'https://github.com/' + this.props.config.git.owner + '/' + this.props.config.git.repo + '/commit/' + commit.sha}>View on GitHub</a>
                    </small>
                    <p className='message'>
                      {commit.msg}
                    </p>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </Widget>
      )
    }
  }
}
