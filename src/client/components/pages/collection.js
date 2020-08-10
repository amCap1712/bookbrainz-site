/*
 * Copyright (C) 2020 Prabal Singh
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as bootstrap from 'react-bootstrap';
import {ENTITY_TYPE_ICONS, genEntityIconHTMLElement} from '../../helpers/entity';
import AddEntityToCollectionModal from './parts/add-entity-to-collection-modal';
import AuthorTable from './entities/author-table';
import DeleteCollectionModal from './parts/delete-collection-modal';
import EditionGroupTable from './entities/editionGroup-table';
import EditionTable from './entities/edition-table';
import EntityImage from './entities/image';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import PagerElement from './parts/pager';
import PropTypes from 'prop-types';
import PublisherTable from './entities/publisher-table';
import React from 'react';
import WorkTable from './entities/work-table';
import _ from 'lodash';
import {formatDate} from '../../helpers/utils';
import request from 'superagent';


const {Alert, Badge, Button, Col, Row} = bootstrap;

function getEntityTable(entityType) {
	const tables = {
		Author: AuthorTable,
		Edition: EditionTable,
		EditionGroup: EditionGroupTable,
		Publisher: PublisherTable,
		Work: WorkTable
	};
	return tables[entityType];
}

function getEntityKey(entityType) {
	const keys = {
		Author: 'authors',
		Edition: 'editions',
		EditionGroup: 'editionGroups',
		Publisher: 'publishers',
		Work: 'works'
	};
	return keys[entityType];
}

function CollectionAttributes({collection}) {
	return (
		<div>
			{
				collection.description.length ?
					<Row>
						<Col md={12}>
							<dt>Description</dt>
							<dd>{collection.description}</dd>
						</Col>
					</Row> : null
			}
			<Row>
				<Col md={3}>
					<dt>Owner</dt>
					<dd><a href={`/editor/${collection.ownerId}`}>{collection.owner.name}</a></dd>
				</Col>
				{
					collection.collaborators.length ?
						<Col md={3}>
							<dt>Collaborator{collection.collaborators.length > 1 ? 's' : null}</dt>
							<dd>
								{
									collection.collaborators.map((collaborator, id) =>
										(
											<a href={`/editor/${collaborator.id}`} key={collaborator.id}>
												{collaborator.text}{id === collection.collaborators.length - 1 ? null : ', '}
											</a>
										)
									)
								}
							</dd>
						</Col> : null
				}
				<Col md={3}>
					<dt>Privacy</dt>
					<dd>{collection.public ? 'Public' : 'Private'}</dd>
				</Col>
				<Col md={3}>
					<dt>Collection type</dt>
					<dd>{collection.entityType}</dd>
				</Col>
				<Col md={3}>
					<dt>Created At</dt>
					<dd>{formatDate(new Date(collection.createdAt), true)}</dd>
				</Col>
				<Col md={3}>
					<dt>Last Modified</dt>
					<dd>{formatDate(new Date(collection.lastModified), true)}</dd>
				</Col>
			</Row>
		</div>
	);
}
CollectionAttributes.displayName = 'CollectionAttributes';
CollectionAttributes.propTypes = {
	collection: PropTypes.object.isRequired
};

class CollectionPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			entities: this.props.entities,
			error: null,
			selectedEntities: [],
			showAddEntityModal: false,
			showDeleteModal: false
		};

		this.entityKey = getEntityKey(this.props.collection.entityType);
		this.paginationUrl = `/collection/${this.props.collection.id}/paginate?q=`;
		this.toggleRow = this.toggleRow.bind(this);
		this.handleRemoveEntities = this.handleRemoveEntities.bind(this);
		this.handleShowDeleteModal = this.handleShowDeleteModal.bind(this);
		this.handleCloseDeleteModal = this.handleCloseDeleteModal.bind(this);
		this.handleShowAddEntityModal = this.handleShowAddEntityModal.bind(this);
		this.handleCloseAddEntityModal = this.handleCloseAddEntityModal.bind(this);
		this.handleAlertDismiss = this.handleAlertDismiss.bind(this);
		this.searchResultsCallback = this.searchResultsCallback.bind(this);
	}

	searchResultsCallback(newResults) {
		this.setState({entities: newResults});
	}

	toggleRow(bbid) {
		// eslint-disable-next-line react/no-access-state-in-setstate
		const oldSelected = this.state.selectedEntities;
		let newSelected;
		if (oldSelected.find(selectedBBID => selectedBBID === bbid)) {
			newSelected = oldSelected.filter(selectedBBID => selectedBBID !== bbid);
		}
		else {
			newSelected = [...oldSelected, bbid];
		}
		this.setState({
			selectedEntities: newSelected
		});
	}

	handleRemoveEntities() {
		if (this.state.selectedEntities.length) {
			const bbids = this.state.selectedEntities;
			const submissionUrl = `/collection/${this.props.collection.id}/remove`;
			request.post(submissionUrl)
				.send({bbids})
				.then((res) => {
					window.location.href = `/collection/${this.props.collection.id}`;
				}, (error) => {
					this.setState({error: 'Something went wrong! Please try again later'});
				});
		}
		else {
			this.setState({error: `No ${_.kebabCase(this.props.collection.entityType)} selected`});
		}
	}

	handleShowDeleteModal() {
		this.setState({showDeleteModal: true});
	}

	handleCloseDeleteModal() {
		this.setState({showDeleteModal: false});
	}

	handleShowAddEntityModal() {
		this.setState({showAddEntityModal: true});
	}

	handleCloseAddEntityModal() {
		this.setState({showAddEntityModal: false});
	}

	handleAlertDismiss() {
		this.setState({error: null});
	}

	render() {
		const errorComponent = this.state.error ?
			<Alert bsStyle="danger" onDismiss={this.handleAlertDismiss}>{this.state.error}</Alert> : null;
		const EntityTable = getEntityTable(this.props.collection.entityType);
		const propsForTable = {
			[this.entityKey]: this.state.entities,
			onToggleRow: this.toggleRow,
			selectedEntities: this.state.selectedEntities,
			showAdd: false,
			showCheckboxes: this.props.isOwner || this.props.isCollaborator
		};
		return (
			<div>
				<DeleteCollectionModal
					collection={this.props.collection}
					show={this.state.showDeleteModal}
					onCloseModal={this.handleCloseDeleteModal}
				/>
				<AddEntityToCollectionModal
					collectionId={this.props.collection.id}
					collectionType={this.props.collection.entityType}
					show={this.state.showAddEntityModal}
					onCloseModal={this.handleCloseAddEntityModal}
				/>
				<Row className="entity-display-background">
					<Col className="entity-display-image-box text-center" md={2}>
						<EntityImage
							backupIcon={ENTITY_TYPE_ICONS[this.props.collection.entityType]}
						/>
					</Col>
					<Col md={10}>
						<h1>{this.props.collection.name}</h1>
						<CollectionAttributes collection={this.props.collection}/>
					</Col>
				</Row>
				<EntityTable{...propsForTable}/>
				{errorComponent}
				<div className="margin-top-1 text-left">
					{
						this.props.isCollaborator || this.props.isOwner ?
							<Button
								bsSize="small"
								bsStyle="primary"
								title={`Add ${this.props.collection.entityType}`}
								onClick={this.handleShowAddEntityModal}
							>
								{genEntityIconHTMLElement('collection')}
								&nbsp;Add {_.lowerCase(this.props.collection.entityType)}
							</Button> : null
					}
					{
						(this.props.isCollaborator || this.props.isOwner) && this.props.entities.length ?
							<Button
								bsSize="small"
								bsStyle="danger"
								disabled={!this.state.selectedEntities.length}
								title={`Remove selected ${_.kebabCase(this.props.collection.entityType)}s`}
								onClick={this.handleRemoveEntities}
							>
								<FontAwesomeIcon icon="times-circle"/>
								&nbsp;Remove <Badge>{this.state.selectedEntities.length}</Badge> selected&nbsp;
								{_.kebabCase(this.props.collection.entityType)}{this.state.selectedEntities.length > 1 ? 's' : null}
							</Button> : null
					}
					{
						this.props.isOwner ?
							<Button
								bsSize="small"
								bsStyle="warning"
								href={`/collection/${this.props.collection.id}/edit`}
								title="Edit Collection"
							>
								<FontAwesomeIcon icon="pencil-alt"/>&nbsp;Edit collection
							</Button> : null
					}
					{
						this.props.isOwner ?
							<Button
								bsSize="small"
								bsStyle="danger"
								title="Delete Collection"
								onClick={this.handleShowDeleteModal}
							>
								<FontAwesomeIcon icon="trash-alt"/>&nbsp;Delete collection
							</Button> : null
					}
				</div>
				<div id="pageWithPagination">
					<PagerElement
						from={this.props.from}
						nextEnabled={this.props.nextEnabled}
						paginationUrl={this.paginationUrl}
						results={this.state.entities}
						searchResultsCallback={this.searchResultsCallback}
						size={this.props.size}
					/>
				</div>
			</div>
		);
	}
}


CollectionPage.displayName = 'CollectionPage';
CollectionPage.propTypes = {
	collection: PropTypes.object.isRequired,
	entities: PropTypes.array,
	from: PropTypes.number,
	isCollaborator: PropTypes.bool,
	isOwner: PropTypes.bool,
	nextEnabled: PropTypes.bool.isRequired,
	size: PropTypes.number
};
CollectionPage.defaultProps = {
	entities: [],
	from: 0,
	isCollaborator: false,
	isOwner: false,
	showCheckboxes: false,
	size: 20
};

export default CollectionPage;
