import React, { Component } from 'react'
import Widget from '../components/Widget'
import Logo from '../style/images/logo.svg'
import Config from '../Config'

export default class Head extends Component {
  render () {
    const link = '//github.com/' + Config.git.owner + '/' + Config.git.owner
    const title = 'github.com/' + Config.git.owner + '/' + Config.git.owner
    return (
      <Widget slug={this.props.slug}>
        <div className='row'>
          <div className='col-6'>
            <a href={link} title={title} target='_blank'><img src={Logo} alt='' /></a>
          </div>
          <div className='col-18'>
            <h2 className='m-0 pt-3'>GOURCE</h2>
            <small>Github project activity</small>
          </div>
        </div>
      </Widget>
    )
  }
}
