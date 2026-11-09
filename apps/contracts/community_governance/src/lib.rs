#![no_std]

//! # Community Governance Contract
//!
//! Sistema de gobernanza comunitaria para toma de decisiones del Hive.
//!
//! Funciones:
//! - `initialize` — Inicializa el contrato con un admin
//! - `create_proposal` — Crea una nueva propuesta (cualquier miembro)
//! - `vote` — Vota a favor o en contra de una propuesta existente
//! - `get_proposal` — Obtiene los datos de una propuesta
//! - `get_proposal_count` — Obtiene el número total de propuestas

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Address, Env, String, Symbol};

const INSTANCE_TTL_THRESHOLD: u32 = 50_000;
const INSTANCE_TTL_EXTEND_TO: u32 = 100_000;
const PERSISTENT_TTL_THRESHOLD: u32 = 50_000;
const PERSISTENT_TTL_EXTEND_TO: u32 = 200_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GovernanceError {
    AlreadyInitialized = 1,
    CounterOverflow = 2,
    ProposalNotFound = 3,
    AlreadyVoted = 4,
}

/// Vote direction for a proposal
#[contracttype]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum VoteDirection {
    For = 1,
    Against = 2,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub proposer: Address,
    pub votes_for: u32,
    pub votes_against: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ProposalCount,
    Proposal(u32),
    /// Tracks whether an address has voted on a proposal: (proposal_id, voter) -> bool
    HasVoted(u32, Address),
}

#[contract]
pub struct CommunityGovernance;

#[contractimpl]
impl CommunityGovernance {
    pub fn initialize(env: Env, admin: Address) -> Result<(), GovernanceError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(GovernanceError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ProposalCount, &0u32);

        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        Ok(())
    }

    pub fn create_proposal(env: Env, proposer: Address, title: String) -> Result<u32, GovernanceError> {
        proposer.require_auth();
        let count: u32 = env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0);
        let id = count.checked_add(1).ok_or(GovernanceError::CounterOverflow)?;

        let proposal = Proposal {
            id,
            title,
            proposer,
            votes_for: 0,
            votes_against: 0,
        };

        let proposal_key = DataKey::Proposal(id);
        env.storage().persistent().set(&proposal_key, &proposal);
        env.storage().persistent().extend_ttl(&proposal_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

        env.storage().instance().set(&DataKey::ProposalCount, &id);
        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "proposal_created"), id),
            proposal.clone(),
        );

        Ok(id)
    }

    /// Vote on a proposal. Each address can only vote once per proposal.
    ///
    /// # Arguments
    /// * `voter` - The address casting the vote (must sign)
    /// * `proposal_id` - The ID of the proposal to vote on
    /// * `direction` - VoteDirection::For or VoteDirection::Against
    pub fn vote(
        env: Env,
        voter: Address,
        proposal_id: u32,
        direction: VoteDirection,
    ) -> Result<Proposal, GovernanceError> {
        voter.require_auth();

        let proposal_key = DataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&proposal_key)
            .ok_or(GovernanceError::ProposalNotFound)?;

        // Check if already voted
        let voted_key = DataKey::HasVoted(proposal_id, voter.clone());
        if env.storage().persistent().has(&voted_key) {
            return Err(GovernanceError::AlreadyVoted);
        }

        // Tally the vote
        match direction {
            VoteDirection::For => {
                proposal.votes_for = proposal
                    .votes_for
                    .checked_add(1)
                    .ok_or(GovernanceError::CounterOverflow)?;
            }
            VoteDirection::Against => {
                proposal.votes_against = proposal
                    .votes_against
                    .checked_add(1)
                    .ok_or(GovernanceError::CounterOverflow)?;
            }
        }

        // Mark as voted
        env.storage().persistent().set(&voted_key, &true);
        env.storage().persistent().extend_ttl(&voted_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

        // Update proposal
        env.storage().persistent().set(&proposal_key, &proposal.clone());
        env.storage().persistent().extend_ttl(&proposal_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "vote_cast"), (proposal_id, voter.clone())),
            (direction, proposal.votes_for, proposal.votes_against),
        );

        Ok(proposal)
    }

    pub fn get_proposal_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0)
    }

    pub fn get_proposal(env: Env, id: u32) -> Option<Proposal> {
        env.storage().persistent().get(&DataKey::Proposal(id))
    }

    /// Check whether an address has voted on a given proposal
    pub fn has_voted(env: Env, proposal_id: u32, voter: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::HasVoted(proposal_id, voter))
            .unwrap_or(false)
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup<'a>(env: &'a Env) -> (CommunityGovernanceClient<'a>, Address) {
        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(env, &contract_id);
        let admin = Address::generate(env);
        let _ = client.try_initialize(&admin);
        (client, admin)
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        let result = client.try_initialize(&admin);
        assert!(result.is_ok());
        assert_eq!(client.get_proposal_count(), 0);
    }

    #[test]
    fn test_reinitialize_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);

        let result = client.try_initialize(&admin);
        assert!(result.is_err());
    }

    #[test]
    fn test_reinitialize_with_different_admin_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        let other_admin = Address::generate(&env);
        let result = client.try_initialize(&other_admin);
        assert!(result.is_err());
    }

    // ========================================================================
    // Proposals
    // ========================================================================

    #[test]
    fn test_create_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Install solar panels")).unwrap().unwrap();

        assert_eq!(id, 1);
        assert_eq!(client.get_proposal_count(), 1);
    }

    #[test]
    fn test_create_multiple_proposals() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        let id1 = client.try_create_proposal(&proposer, &String::from_str(&env, "Proposal A")).unwrap().unwrap();
        let id2 = client.try_create_proposal(&proposer, &String::from_str(&env, "Proposal B")).unwrap().unwrap();
        let id3 = client.try_create_proposal(&proposer, &String::from_str(&env, "Proposal C")).unwrap().unwrap();

        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
        assert_eq!(id3, 3);
        assert_eq!(client.get_proposal_count(), 3);
    }

    #[test]
    fn test_proposal_data_stored_correctly() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let title = String::from_str(&env, "Buy new inverters");

        let id = client.try_create_proposal(&proposer, &title).unwrap().unwrap();

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.id, id);
        assert_eq!(proposal.title, title);
        assert_eq!(proposal.proposer, proposer);
        assert_eq!(proposal.votes_for, 0);
        assert_eq!(proposal.votes_against, 0);
    }

    #[test]
    fn test_different_proposers() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer1 = Address::generate(&env);
        let proposer2 = Address::generate(&env);

        let id1 = client.try_create_proposal(&proposer1, &String::from_str(&env, "From user 1")).unwrap().unwrap();
        let id2 = client.try_create_proposal(&proposer2, &String::from_str(&env, "From user 2")).unwrap().unwrap();

        let p1 = client.get_proposal(&id1).unwrap();
        let p2 = client.get_proposal(&id2).unwrap();
        assert_eq!(p1.proposer, proposer1);
        assert_eq!(p2.proposer, proposer2);
    }

    #[test]
    fn test_get_nonexistent_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        assert_eq!(client.get_proposal(&999), None);
    }

    // ========================================================================
    // Voting
    // ========================================================================

    #[test]
    fn test_vote_for() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);

        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Buy new inverters")).unwrap().unwrap();

        let proposal = client.try_vote(&voter, &id, &VoteDirection::For).unwrap().unwrap();
        assert_eq!(proposal.votes_for, 1);
        assert_eq!(proposal.votes_against, 0);
    }

    #[test]
    fn test_vote_against() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);

        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Install wind turbine")).unwrap().unwrap();

        let proposal = client.try_vote(&voter, &id, &VoteDirection::Against).unwrap().unwrap();
        assert_eq!(proposal.votes_for, 0);
        assert_eq!(proposal.votes_against, 1);
    }

    #[test]
    fn test_multiple_votes_for() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Expand solar array")).unwrap().unwrap();

        for _ in 0..5 {
            let voter = Address::generate(&env);
            client.try_vote(&voter, &id, &VoteDirection::For).unwrap();
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.votes_for, 5);
        assert_eq!(proposal.votes_against, 0);
    }

    #[test]
    fn test_multiple_votes_against() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Replace inverter")).unwrap().unwrap();

        for _ in 0..3 {
            let voter = Address::generate(&env);
            client.try_vote(&voter, &id, &VoteDirection::Against).unwrap();
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.votes_for, 0);
        assert_eq!(proposal.votes_against, 3);
    }

    #[test]
    fn test_mixed_votes() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Mixed proposal")).unwrap().unwrap();

        // 3 for
        for _ in 0..3 {
            let voter = Address::generate(&env);
            client.try_vote(&voter, &id, &VoteDirection::For).unwrap();
        }
        // 2 against
        for _ in 0..2 {
            let voter = Address::generate(&env);
            client.try_vote(&voter, &id, &VoteDirection::Against).unwrap();
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.votes_for, 3);
        assert_eq!(proposal.votes_against, 2);
    }

    #[test]
    fn test_double_vote_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);
        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Test proposal")).unwrap().unwrap();

        // First vote succeeds
        let first = client.try_vote(&voter, &id, &VoteDirection::For);
        assert!(first.is_ok());

        // Second vote fails
        let second = client.try_vote(&voter, &id, &VoteDirection::For);
        assert!(second.is_err());
    }

    #[test]
    fn test_double_vote_opposite_direction_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);
        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Test proposal")).unwrap().unwrap();

        // Vote for
        client.try_vote(&voter, &id, &VoteDirection::For).unwrap();

        // Try to vote against - should fail
        let second = client.try_vote(&voter, &id, &VoteDirection::Against);
        assert!(second.is_err());

        // Tally unchanged
        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.votes_for, 1);
        assert_eq!(proposal.votes_against, 0);
    }

    #[test]
    fn test_vote_on_nonexistent_proposal_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let voter = Address::generate(&env);

        let result = client.try_vote(&voter, &999, &VoteDirection::For);
        assert!(result.is_err());
    }

    #[test]
    fn test_has_voted() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);
        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Test")).unwrap().unwrap();

        // Before voting
        assert!(!client.has_voted(&id, &voter));

        // Vote
        client.try_vote(&voter, &id, &VoteDirection::For).unwrap();

        // After voting
        assert!(client.has_voted(&id, &voter));
    }

    #[test]
    fn test_has_voted_other_address_not_affected() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter1 = Address::generate(&env);
        let voter2 = Address::generate(&env);
        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Test")).unwrap().unwrap();

        client.try_vote(&voter1, &id, &VoteDirection::For).unwrap();

        assert!(client.has_voted(&id, &voter1));
        assert!(!client.has_voted(&id, &voter2));
    }

    // ========================================================================
    // Edge Cases
    // ========================================================================

    #[test]
    fn test_proposal_count_before_initialize() {
        let env = Env::default();
        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);

        assert_eq!(client.get_proposal_count(), 0);
    }

    #[test]
    fn test_sequential_ids_never_skip() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        for expected_id in 1u32..=10 {
            let id = client.try_create_proposal(&proposer, &String::from_str(&env, "test")).unwrap().unwrap();
            assert_eq!(id, expected_id);
        }
        assert_eq!(client.get_proposal_count(), 10);
    }

    #[test]
    fn test_get_proposal_id_zero_returns_none() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        // IDs start at 1, so ID 0 should never exist
        assert_eq!(client.get_proposal(&0), None);
    }

    #[test]
    fn test_counter_overflow_returns_error() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let _ = client.try_initialize(&admin);
        let proposer = Address::generate(&env);

        // Manually set the counter to u32::MAX
        env.as_contract(&contract_id, || {
            env.storage().instance().set(&DataKey::ProposalCount, &u32::MAX);
        });

        let result = client.try_create_proposal(&proposer, &String::from_str(&env, "overflow"));
        assert!(result.is_err());
    }

    #[test]
    fn test_vote_counter_overflow_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "overflow test")).unwrap().unwrap();

        // Manually set votes_for to u32::MAX
        env.as_contract(&client.address, || {
            let mut proposal: Proposal = env.storage().persistent().get(&DataKey::Proposal(id)).unwrap();
            proposal.votes_for = u32::MAX;
            env.storage().persistent().set(&DataKey::Proposal(id), &proposal);
        });

        let voter = Address::generate(&env);
        let result = client.try_vote(&voter, &id, &VoteDirection::For);
        assert!(result.is_err());
    }
}
