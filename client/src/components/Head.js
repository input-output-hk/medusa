import React, { Component } from 'react'
import Widget from '../components/Widget'
import Logo from '../style/images/logo.svg'
import Config from '../Config'

export default class Head extends Component {
  render () {
    const link = '//github.com/' + Config.git.owner + '/' + Config.git.owner
    const title = 'github.com/' + Config.git.owner + '/' + Config.git.owner
    return (
      <Widget slug={'head'} icon={this.props.icon}>
        <div className='row'>
          <div className='col-9 col-sm-9 col-md-7 col-xl-6'>
            <a href={link} title={title} target='_blank'><img src={Logo} alt='' /></a>
          </div>
          <div className='col-15 col-sm-15 col-md-17 col-xl-18'>
            <h2 className='m-0 pt-2'>{this.props.config.widget.head.title}</h2>
            <small>{this.props.config.widget.head.subtitle}</small>
            <div>{this.props.config.widget.head.content}</div>
          </div>
        </div>
      </Widget>
    )
  }
}
