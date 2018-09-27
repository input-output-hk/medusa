import React, { Component } from 'react'

export default class Calendar extends Component {
  render () {
    return (
      <button
        className='calendar border-0 bg-transparent'
        onClick={this.props.onClick}>
        <span className='icon-calendar text-secondary' />
      </button>
    )
  }
}
