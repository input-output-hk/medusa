import React, { Component } from 'react'
import Widget from '../components/Widget'
import renderHTML from 'react-render-html'

export default class About extends Component {
  render () {
    return (
      <Widget title={this.props.config.widget.about.title} slug={'about'} icon={this.props.icon}>
        <div>{renderHTML(this.props.config.widget.about.content)}</div>
      </Widget>
    )
  }
}
