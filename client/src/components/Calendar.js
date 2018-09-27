import React, { Component } from 'react'

export default class Calendar extends Component {
  render () {
    return (
      <button
        className="calendar border-0 bg-transparent d-block d-md-inline-block"
        onClick={this.props.onClick}>
        <span className="icon-calendar text-secondary"></span>
      </button>
    )
  }
}
