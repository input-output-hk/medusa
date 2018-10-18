import React, { Component } from 'react'
import Widget from '../components/Widget'
import CommitInfo from '../components/CommitInfo'

import { IconContext } from "react-icons";
import { FaExternalLinkAlt} from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';

export default class CommitList extends Component {
  //

  //
  // <div className="card-body">
  //   <div className='commit--switcher'>
  //     <a onClick={this.props.goToPrev} className='prev' title='Previous commit'>Previous<em className='icon-arrow-down' /></a>
  //     <a onClick={this.props.goToNext} className='next' title='Next commit'>Next<em className='icon-arrow-up' /></a>
  //   </div>
  // </div>

  render () {
    if (this.props.config.display.showSidebar) {
      const infopanel = <CommitInfo currentAdded={this.props.currentAdded} currentChanged={this.props.currentChanged} currentRemoved={this.props.currentRemoved} currentAuthor={this.props.currentAuthor} currentMsg={this.props.currentMsg} currentDate={this.props.currentDate} currentCommitHash={this.props.currentCommitHash} />
      //const info = (commit.index === this.props.sidebarCurrentCommitIndex) ? infopanel : ''

      return (
        <Widget title={this.props.title} slug={this.props.slug} icon={this.props.icon} test={this.props.test} list={'true'}>

          <ul className='list-group list-group-flush'>
            {this.props.sideBarCommits.map((commit) =>
              <li key={commit.sha}
                className={commit.index === this.props.sidebarCurrentCommitIndex ? 'list-group-item bg-transparent current' : 'list-group-item bg-transparent'}
                onClick={() => { this.props.loadCommit(commit.sha) }}>
                <div className='row'>
                  <div className='col-24 col-md-5 col-xl-4 gravatar'>
                    <img src={commit.gravatar} className='rounded-circle' width='40' height='40' alt='' />
                  </div>
                  <div className='col-24 col-md-19 col-xl-20'>
                    <a className='github float-right' target='_blank' title='View Commit on GitHub' href={'https://github.com/' + this.props.config.git.owner + '/' + this.props.config.git.repo + '/commit/' + commit.sha}><FaExternalLinkAlt /></a>
                    <strong className='m-0 d-block'>{commit.author}</strong>
                    <small>
                      <span className='date' title={commit.dateLong}>{commit.dateLong}</span>
                    </small>


                    {commit.index === this.props.sidebarCurrentCommitIndex ? infopanel : <p className='message'><FiMessageSquare /> {commit.msg}</p>}

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
