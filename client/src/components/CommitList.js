import React, { Component } from 'react'
import Widget from '../components/Widget'
import CommitInfo from '../components/CommitInfo'
import SVG from 'react-inlinesvg'

import IconLink from '../style/images/icon-link.svg'
import IconMessage from '../style/images/icon-message.svg'


export default class CommitList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '5',
      minimized: true,
      minimizeLabel: 'Expand'
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleMinimize = this.handleMinimize.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value })
    if (typeof this.props.onChange === 'function') {
        this.props.onChange(event.target.value)
    }
  }

  handleMinimize(event) {
    this.setState({
      minimized: !this.state.minimized,
      minimizeLabel: (!this.state.minimized) ? 'Expand' : 'Shrink'
    })
    console.log(this.state.minimized)
  }


  render () {
    const { selectedOption } = this.state;
    const infopanel = <CommitInfo config={this.props.config} currentAdded={this.props.currentAdded} currentChanged={this.props.currentChanged} currentRemoved={this.props.currentRemoved} currentAuthor={this.props.currentAuthor} currentMsg={this.props.currentMsg} currentDate={this.props.currentDate} currentCommitHash={this.props.currentCommitHash} />
    const selector = <div className="select m-3 mt-2"><button ref='btn' className="float-right d-md-none" onClick={this.handleMinimize}>{this.state.minimizeLabel}</button> <div className="selector"><small>{this.props.showing}</small>&nbsp;&nbsp;<select className="" value={this.state.value} onChange={this.handleChange}><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="500">500</option></select></div><div className="clear"></div></div>
    const extracls = (!this.state.minimized) ? 'expanded' : ''

    return (
      <Widget title={this.props.title} slug={this.props.slug} extraclass={extracls} icon={this.props.icon} list={'true'} value={this.state.value} onChange={this.handleChange} subhead={selector}>
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
                  <a className='github float-right' target='_blank' title='View Commit on GitHub' href={'https://github.com/' + this.props.config.git.owner + '/' + this.props.config.git.repo + '/commit/' + commit.sha}><SVG src={IconLink}></SVG></a>
                  <strong className='m-0 d-block'>{commit.author}</strong>
                  <small>
                    <span className='date' title={commit.dateLong}>{commit.dateLong}</span>
                  </small>
                  {commit.index === this.props.sidebarCurrentCommitIndex ? infopanel : <p className='message'><SVG src={IconMessage}></SVG> {commit.msg}</p>}
                </div>
              </div>
            </li>
          )}
        </ul>
      </Widget>
    )
  }
}
