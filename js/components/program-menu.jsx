import Preact from "preact";

import makeRequest from "../util/makeRequest";
import ConfirmDialog from "./dialog/confirm-dialog";

class SettingsPopup extends Preact.Component {
    constructor (props) {
        super(props);

        this.state = {
            checked: props.isPrivate
        };

        this.oninput = this.oninput.bind(this);
    }

    oninput (e) {
        this.setState({
            checked: e.srcElement.checked
        });
    }

    render () {
        return <ConfirmDialog 
                cancelButton="Cancel"
                confirmButton="Save"
                onCancel={this.props.onCancel} 
                onConfirm={() => this.props.onConfirm(this.state.checked) }>
            <div className="confirm-info">Private? <input type="checkbox" checked={this.state.checked} onInput={this.oninput} /></div>
        </ConfirmDialog>;
    }
}

class CollaboratorPopup extends Preact.Component {
    constructor (props) {
        super(props);

        this.collaboratorAdded = this.collaboratorAdded.bind(this);
        this.keyup = this.keyup.bind(this);
        this.oninput = this.oninput.bind(this);

        this.collaboratorToAdd = "";
    }

    collaboratorAdded () {
        this.props.collaboratorAdded(this.collaboratorToAdd);
    }

    keyup (event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            this.collaboratorAdded();
        }
    }

    oninput (event) {
        this.collaboratorToAdd = event.srcElement.value;
    }

    render () {
        if (this.props.isOpen) {
            return <div className="collaborate-popup popup">
                <div className="close-button-wrap" onClick={this.props.onClose}>
                    <span className="icon icon-cancel clickable"></span>
                </div>
                <div className="wrapper">
                    <div className="header">Collaborators</div>
                    <ul className="collaborators">
                        <li className="add-collaborator">
                            <span className="icon icon-user-plus clickable" onclick={this.collaboratorAdded}></span>
                            <input type="text" oninput={this.oninput} className="add-collaborator-textbox" onkeyup={this.keyup} placeholder="Add collaborator by username"></input>
                        </li>
                        {this.props.collaborators.map(collaborator => {
                            return <li key={collaborator.id}>
                                <span className="icon icon-delete clickable" onClick={() => this.props.collaboratorRemoved(collaborator.id)}></span>
                                {collaborator.name}
                            </li>;
                        })}
                    </ul>
                </div>
            </div>;
        }
    }
}

class ViewerPopup extends Preact.Component {
    constructor (props) {
        super(props);

        this.viewerAdded = this.viewerAdded.bind(this);
        this.keyup = this.keyup.bind(this);
        this.oninput = this.oninput.bind(this);

        this.viewerToAdd = "";
    }

    viewerAdded () {
        this.props.viewerAdded(this.viewerToAdd);
    }

    keyup (event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            this.viewerAdded();
        }
    }

    oninput (event) {
        this.viewerToAdd = event.srcElement.value;
    }

    render () {
        if (this.props.isOpen) {
            return <div className="collaborate-popup popup">
                <div className="close-button-wrap" onClick={this.props.onClose}>
                    <span className="icon icon-cancel clickable"></span>
                </div>
                <div className="wrapper">
                    <div className="header">Viewers</div>
                    <ul className="collaborators">
                        <li className="add-collaborator">
                            <span className="icon icon-user-plus clickable" onclick={this.viewerAdded}></span>
                            <input type="text" oninput={this.oninput} className="add-collaborator-textbox" onkeyup={this.keyup} placeholder="Add collaborator by username"></input>
                        </li>
                        {this.props.viewers.map(viewer => {
                            return <li key={viewer.id}>
                                <span className="icon icon-delete clickable" onClick={() => this.props.viewerRemoved(viewer.id)}></span>
                                {viewer.name}
                            </li>;
                        })}
                    </ul>
                </div>
            </div>;
        }
    }
}

export default class ProgramMenu extends Preact.Component {
    constructor (props) {
        super(props);

        this.initialCollaboratorIds = props.programData.collaborators;
        this.initialViewerIds = props.programData.viewers;

        this.state = {
            collabPopupOpen: false,
            viewerPopupOpen: false,
            settingsPopupOpen: false,
            collaborators: props.programData.collaborators,
            viewers: props.programData.viewers
        };

        this.toggleCollaboratorPopup = this.toggleCollaboratorPopup.bind(this);
        this.closeCollaboratorPopup = this.closeCollaboratorPopup.bind(this);
        this.removeCollaborator = this.removeCollaborator.bind(this);
        this.addCollaborator = this.addCollaborator.bind(this);

        this.toggleViewerPopup = this.toggleViewerPopup.bind(this);
        this.closeViewerPopup = this.closeViewerPopup.bind(this);
        this.removeViewer = this.removeViewer.bind(this);
        this.addViewer = this.addViewer.bind(this);

        this.openSettingsPopup = this.openSettingsPopup.bind(this);
        this.closeSettingsPopup = this.closeSettingsPopup.bind(this);
        this.saveSettings = this.saveSettings.bind(this);

        this.initCollaborators();
        this.initViewers();
    }

    async initCollaborators () {
        // get all the usernames based on the user's ids
        const users = await Promise.all(this.initialCollaboratorIds.map(id => {
                return new Promise((resolve, _) => {
                    makeRequest("GET", "/api/user/" + id, function (data) {
                        resolve({
                            name: data.username,
                            id: data.id
                        });
                    }, {action: "Displaying collaborator " + id});
                });                
            }
        ));

        this.setState({
            collaborators: users
        });
    }

    async initViewers () {
        // get all the usernames based on the user's ids
        const users = await Promise.all(this.initialViewerIds.map(id => {
                return new Promise((resolve, _) => {
                    makeRequest("GET", "/api/user/" + id, function (data) {
                        resolve({
                            name: data.username,
                            id: data.id
                        });
                    }, {action: "Displaying viewer " + id});
                });                
            }
        ));

        this.setState({
            viewers: users
        });
    }

    toggleCollaboratorPopup () {
        this.setState({
            collabPopupOpen: !this.state.collabPopupOpen
        });
    }

    toggleViewerPopup () {
        this.setState({
            viewerPopupOpen: !this.state.viewerPopupOpen
        });
    }

    openSettingsPopup () {
        this.setState({
            settingsPopupOpen: true
        });

        var backcover = document.getElementById("back-cover");
        backcover.style.display = "block";
    }

    closeSettingsPopup () {
        this.setState({
            settingsPopupOpen: false
        });

        var backcover = document.getElementById("back-cover");
        backcover.style.display = "none";
    }

    closeCollaboratorPopup () {
        this.setState({
            collabPopupOpen: false
        });
    }

    closeViewerPopup () {
        this.setState({
            viewerPopupOpen: false
        });
    }

    removeCollaborator (id) {
        if(this.props.userData.id === id) {
            if (!confirm("You're about to remove yourself from the collaborators on this program.\nYou can't undo this action.")) {
                return;
            }
        }

        const programId = this.props.programData.id;
        makeRequest("DELETE", `/api/program/${programId}/collaborators`, data => {
            this.setState({
                // filter out removed collaborator
                collaborators: this.state.collaborators.filter(x => x.id !== id)
            });

            //If you just removed yourself, refresh everything
            if (this.props.userData.id === id) {
                window.location.reload();
            }
        }, {action: "Removing collaborator " + id, data: {user: {id: id}}});
    }

    removeViewer (id) {
        if(this.props.userData.id === id) {
            if (!confirm("You're about to remove yourself as a viewer of this program.\nYou can't undo this action.")) {
                return;
            }
        }

        const programId = this.props.programData.id;
        makeRequest("DELETE", `/api/program/${programId}/viewers`, data => {
            this.setState({
                // filter out removed viewer
                viewers: this.state.viewers.filter(x => x.id !== id)
            });

            //If you just removed yourself, refresh everything
            if (this.props.userData.id === id) {
                window.location.reload();
            }
        }, {action: "Removing viewer " + id, data: {user: {id: id}}});
    }

    addCollaborator (username) {
        //Silently ignore empty textbox/input
        if (username.length === 0) {
            return;
        }

        //Make a request to add the user (backend verifies user)
        const programId = this.props.programData.id;
        makeRequest("POST", `/api/program/${programId}/collaborators`, _ => {
            this.setState({
                collaborators: [...this.state.collaborators, {
                    name: username,
                }]
            });
        }, {
            data: {user: {username: username}},
            action: "Adding collaborator \"" + username + "\"",
        });
    }

    addViewer (username) {
        //Silently ignore empty textbox/input
        if (username.length === 0) {
            return;
        }

        //Make a request to add the user (backend verifies user)
        const programId = this.props.programData.id;
        makeRequest("POST", `/api/program/${programId}/viewers`, _ => {
            this.setState({
                viewers: [...this.state.viewers, {
                    name: username,
                }]
            });
        }, {
            data: {user: {username: username}},
            action: "Adding viewer \"" + username + "\"",
        });
    }

    saveSettings (isPrivate) {
        window.interopWithReact.save(false, isPrivate);
        this.props.programData.is_private = isPrivate;
        this.closeSettingsPopup();
    }

    render () {
        return <div>
        <nav className="navbar navbar-default">
            <div className="toolbar">
                <ul className="nav navbar-nav">
                    <li className="run-button">
                        <a onClick={e => window.interopWithReact.runButton(e)}>
                            <span className="icon icon-run"></span> Run
                        </a>
                    </li>
                    <li>
                        <a onClick={this.toggleCollaboratorPopup}><span className="icon icon-user-plus"></span> Collaborate</a>
                        <CollaboratorPopup onClose={this.closeCollaboratorPopup} collaboratorRemoved={this.removeCollaborator} collaboratorAdded={this.addCollaborator} isOpen={this.state.collabPopupOpen} collaborators={this.state.collaborators} />
                    </li>
                    {this.props.programData.is_private ? 
                    <li>
                        <a onClick={this.toggleViewerPopup}><span className="icon icon-user-plus"></span> Viewers</a>
                        <ViewerPopup onClose={this.closeViewerPopup} viewerRemoved={this.removeViewer} viewerAdded={this.addViewer} isOpen={this.state.viewerPopupOpen} viewers={this.state.viewers} />
                    </li> : null}
                    <li id="settings-button">
                        <a onClick={this.openSettingsPopup}>
                            <span className="icon icon-edit"></span> Settings
                        </a>
                    </li>
                    <li id="save-button">
                        <a onClick={e => window.interopWithReact.saveButton(e)}>
                            <span className="icon icon-save"></span> Save
                        </a>
                    </li>
                    <li id="publish-button">
                        <a onClick={e => window.interopWithReact.publishButton(e)}>
                            <span className="icon icon-bell"></span> Publish
                        </a>
                    </li>
                    <li id="fork-button">
                        <a onClick={e => window.interopWithReact.forkButton(e)}>
                            <span className="icon icon-flow-split"></span> Fork
                        </a>
                    </li>
                    <li id="delete-button">
                        <a onClick={e => window.interopWithReact.deleteButton(e)}>
                            <span className="icon icon-delete"></span> Delete
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
        { this.state.settingsPopupOpen ?
            <SettingsPopup onConfirm={this.saveSettings} onCancel={this.closeSettingsPopup} isPrivate={this.props.programData.is_private} />
            : ""
        }
        
        </div>;
    }
}
