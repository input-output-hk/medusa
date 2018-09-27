import React, { Component } from 'react'

export default class Content extends Component {
  render () {
    return (
      <div className='UI-content'>
        <div className='content'>
          {this.props.children}
        </div>
      </div>
    )
  }
}
