import React, { Component } from 'react'
import loadingImg from '../assets/images/loading.svg'
export default class FileInfo extends Component {
  render () {
    return (
      <div className='medusa-file-info-widget' style={{ left: this.props.fileInfoLocation.x + 30, top: this.props.fileInfoLocation.y - 50, display: this.props.showFileInfo ? 'block' : 'none' }}>
        <div className='file-info-loading' style={{ display: this.props.loadingFileInfo ? 'block' : 'none' }}>
          <img width='70' src={loadingImg} alt='Loading' />
        </div>
        <div className='file-info-contents' style={{ display: this.props.loadingFileInfo ? 'none' : 'block' }}>
          <div className='file-info-gravatar'>
            <img src={this.props.selectedFileAuthorImg} width='40' height='40' alt='' />
          </div>
          <div className='file-info-details'>
            <div className='file-info-author-name'>
              <p>
                <a href={'https://github.com/' + this.props.config.git.owner + '/' + this.props.config.git.repo + '/commits?author=' + this.props.selectedFileAuthorLogin}
                  target='_blank'
                  title={'View all commits by ' + this.props.selectedFileAuthorName}
                >
                  {this.props.selectedFileAuthorName}
                </a> {this.props.selectedFileDateRelative}
              </p>
            </div>
            <div className='file-info-name'>
              <p>{this.props.selectedFileName}</p>
            </div>
            <div className='file-info-message'>
              <p>{this.props.selectedFileMessage}</p>
            </div>
            <div className='file-info-links'>
              <a className='' href={'https://github.com/' + this.props.config.git.owner + '/' + this.props.config.git.repo + '/blob/' + this.props.selectedFileCommitID + '/' + this.props.selectedFilePath}
                target='_blank'
                title='View file on GitHub'
              >{this.props.config.widget.commitList.viewfile}</a>&nbsp;|&nbsp;
              <a href={this.props.selectedFileCommitURL}
                target='_blank'
                title='View full commit on GitHub'
              >{this.props.config.widget.commitList.viewcommit}</a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
