import Preact from "preact";

export default class ConfirmDialog extends Preact.Component {
    constructor (props) {
        super(props);
    }

    render () {
        return <div className="confirm" style="display: block">
            { this.props.children }
            <span className="confirm-buttons">
                <a className="confirm-cancel" onClick={ this.props.onCancel }>{ this.props.cancelButton }</a>
                <a className="confirm-confirm" onClick={ this.props.onConfirm }>{ this.props.confirmButton }</a>
            </span>
        </div>
    }
}

