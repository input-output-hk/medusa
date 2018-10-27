import React, { Component } from 'react'
import Widget from '../components/Widget'
import CommitInfo from '../components/CommitInfo'
import Select from 'react-select'

import { IconContext } from "react-icons";
import { FaExternalLinkAlt} from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';

const options = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '30', label: '30' },
  { value: '50', label: '50' },
  { value: '99999999', label: 'All' },
]

const customStyles = {
  option: (base, state) => ({
    borderBottom: '1px solid rgba(0,0,0,0.2)',
    padding: 5,
  }),
  control: (base, state) => ({
    border: '0 solid rgba(0,0,0,0.2)',
    background: 'rgba(255,255,255,0.2)',
    padding: 0,
  }),
}

export default class CommitList extends Component {

  state = {
    selectedOption: null,
  }
  handleChange = (selectedOption) => {
    this.setState({ selectedOption })
    if (typeof this.props.onChange === 'function') {
        this.props.onChange(selectedOption)
    }
  }

  render () {
    if (this.props.config.display.showSidebar) {
      const { selectedOption } = this.state;
      const infopanel = <CommitInfo currentAdded={this.props.currentAdded} currentChanged={this.props.currentChanged} currentRemoved={this.props.currentRemoved} currentAuthor={this.props.currentAuthor} currentMsg={this.props.currentMsg} currentDate={this.props.currentDate} currentCommitHash={this.props.currentCommitHash} />

      return (
        <Widget title={this.props.title} slug={this.props.slug} icon={this.props.icon} list={'true'} onChange={this.props.onChange} value={this.props.value}>
          <div className="row control-count">
            <div className="col-16">
              <label className="d-inline-block ml-3">Commit display count</label>
            </div>
            <div className="col-8">
              <Select
                className="select mr-3"
                value={selectedOption}
                placeholder="5"
                onChange={this.handleChange}
                styles={customStyles}
                options={options}
              />
            </div>
          </div>
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
